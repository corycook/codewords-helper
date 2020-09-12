import {config} from 'dotenv';
config();

import {ApolloServer} from 'apollo-server';
import {arg, createSchema, field, type} from 'graphql-schema-bindings';
import fetch from 'node-fetch';

const WORDASSOCIATIONS_NET_URL =
    'https://api.wordassociations.net/associations/v1.0/json/search';

interface WordAssociationsSearchResponse {
  version: string;
  code: number;
  request: {
    text: string[]; lang: 'en'; type: 'stimulus' | 'response'; limit: number;
    pos: string;  // e.g. "noun,adjective,verb,adverb"
    indent: 'yes' | 'no'
  };
  response: Array<{
    text: string,
    items: Array<{
      item: string; weight: number;
      pos: 'noun' | 'adjective' | 'verb' | 'adjective';
    }>
  }>;
}

@type
class Query {
  @field(() => [Association])
  async stimuli(@arg([String]) words: string[]): Promise<Association[]> {
    const associations = await getWordAssociations(words);
    return removeDuplicates(associations.response.flatMap(
        r => r.items.map(item => new Association({...item, word: r.text}))));
  }

  @field(() => [Codeword])
  async codewords(@arg([String]) words: string[]): Promise<Codeword[]> {
    const all = await this.stimuli(words);
    const grouped = groupWordAssociations(all);
    return Object.keys(grouped)
        .map(word => new Codeword({word, matches: grouped[word]}))
        .sort((l, r) => r.weight - l.weight);
  }
}

@type
class Association {
  constructor(private readonly data:
                  WordAssociationsSearchResponse['response'][0]['items'][0]&
              {word: string}) {}

  @field()
  get word(): string {
    return this.data.word;
  }

  @field()
  get relatedWord(): string {
    return this.data.item;
  }

  @field()
  get weight(): number {
    return this.data.weight;
  }
}

@type
class Codeword {
  @field() private readonly word: string;
  private readonly matches: Association[];

  constructor(data: {word: string, matches: Association[]}) {
    this.word = data.word;
    // remove duplicate related words
    this.matches = data.matches.reduce(
        (result: Association[], next) =>
            result.some(i => i.word == next.word) ? result : [...result, next],
        []);
  }

  @field()
  get count(): number {
    return this.matches.length;
  }

  @field()
  get weight(): number {
    return this.matches.reduce((sum, match) => sum + match.weight, 0);
  }

  @field([String])
  get words(): string[] {
    return this.matches.map(m => m.word);
  }
}

function removeDuplicates<T>(list: T[]): T[] {
  const db: {[hash: string]: T} = list.reduce(
      (result, item) => ({...result, [JSON.stringify(item)]: item}), {});
  return Object.values(db);
}

async function getWordAssociations(text: string[] = []):
    Promise<WordAssociationsSearchResponse> {
  const textArg = text.map(t => `text=${t}`).join('&');
  const response = await fetch(`${WORDASSOCIATIONS_NET_URL}?apikey=${
      process.env.WORDASSOCIATIONS_NET_API_KEY}&lang=en&${textArg}&limit=100`);
  return response.json();
}

function groupWordAssociations(associations: Association[]):
    {[word: string]: Association[]} {
  return associations.reduce(
      (accumulator, current) => ({
        ...accumulator,
        [current.relatedWord]:
            [...(accumulator[current.relatedWord] || []), current],
      }),
      {} as {[word: string]: Association[]});
}

/**
 * Now we are ready to create our ApolloServer and start listening for requests.
 */
const server = new ApolloServer({
  schema: createSchema(Query),
  context: new Query(),
});
server.listen().then(({url}) => console.log(`Server ready at ${url}`));