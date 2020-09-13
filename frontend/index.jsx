import React, { useState, useEffect } from 'react';
import { render } from 'react-dom';
import { Button, Input, FormControl, InputLabel, FormHelperText, FormGroup, CircularProgress, Table, TableBody, TableHead, TableRow, TableCell } from '@material-ui/core';
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

const client = new ApolloClient({
  uri: "http://localhost:4000",
  cache: new InMemoryCache()
});

render(
  <App />,
  document.getElementById('root')
);

function App() {
  const [words, setWords] = useState([]);
  const [excluded, setExcluded] = useState([]);
  const [formState, setFormState] = useState({ words: [], excluded: [] });

  function onChange(value, handler) {
    handler((value || '').split(',').map(item => item.trim()));
  }

  return <>
    <form>
      <FormGroup>
        <FormControl>
          <InputLabel htmlFor="include">Include words</InputLabel>
          <Input id="include" aria-describedby="include-helper-text" onChange={e => onChange(e.target.value, setWords)} />
          <FormHelperText id="include-helper-text">Words included in search (comma delimited)</FormHelperText>
        </FormControl>
      </FormGroup>
      <FormGroup>
        <FormControl>
          <InputLabel htmlFor="exclude">Exclude words</InputLabel>
          <Input id="exclude" aria-describedby="exclude-helper-text" onChange={e => onChange(e.target.value, setExcluded)} />
          <FormHelperText id="exclude-helper-text">Words excluded in search (comma delimited)</FormHelperText>
        </FormControl>
      </FormGroup>
      <FormGroup>
        <Button variant="contained" color="primary" onClick={() => setFormState({ words, excluded })}>Search</Button>
      </FormGroup>
    </form>
    <Results {...formState} />
  </>;
}

function Results({ words = [], excluded = [] }) {
  const [isLoading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (words.length === 0) return;

    setLoading(true);
    client.query({
      query: gql`
        query($words: [String!], $excluded: [String!]) {
          codewords(words: $words, exclude: $excluded) {
            word
            count
            weight
            words
          }
        }
      `,
      variables: { words, excluded }
    }).then((response) => {
      setResults(response.data.codewords);
      setLoading(false);
    });
  }, [words, excluded]);

  if (isLoading) {
    return <CircularProgress />;
  }

  if (results.length === 0) return null;

  return <Table>
    <TableHead>
      <TableRow>
        <TableCell>Score</TableCell>
        <TableCell>Count</TableCell>
        <TableCell>Codeword</TableCell>
        <TableCell>Words</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {(results || []).map(result =>
        <TableRow key={result.word}>
          <TableCell>{result.weight}</TableCell>
          <TableCell>{result.count}</TableCell>
          <TableCell>{result.word.toLowerCase()}</TableCell>
          <TableCell>{result.words.join(', ').toLowerCase()}</TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>;
}
