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
  @field(() => [WordAssociationResponse])
  async stimuli(@arg([String]) text: string[]):
      Promise<WordAssociationResponse[]> {
    const wordAssociations = await getWordAssociations(text);
    return wordAssociations.response.map(r => new WordAssociationResponse(r));
  }
}

@type
class WordAssociationResponse {
  constructor(private readonly data:
                  WordAssociationsSearchResponse['response'][0]) {}

  @field(String)
  get text(): string {
    return this.data.text;
  }

  @field([String])
  get associations(): string[] {
    return this.data.items.map(i => i.item);
  }
}


async function getWordAssociations(text: string[] = []):
    Promise<WordAssociationsSearchResponse> {
  const textArg = text.map(t => `text=${t}`).join('&');
  const response = await fetch(`${WORDASSOCIATIONS_NET_URL}?apikey=${
      process.env.WORDASSOCIATIONS_NET_API_KEY}&lang=en&${textArg}`);
  return response.json();
}

/**
 * Now we are ready to create our ApolloServer and start listening for requests.
 */
const server = new ApolloServer({
  schema: createSchema(Query),
  context: new Query(),
});
server.listen().then(({url}) => console.log(`Server ready at ${url}`));