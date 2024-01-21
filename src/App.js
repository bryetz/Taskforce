import logo from './logo.svg';
import './App.css';
import React from 'react';

function App() {

  const [data, setData] = React.useState("");
  const [input, setInput] = React.useState("");

  const submitData = () => {
    setData("Loading...");
    fetch('http://127.0.0.1:5000/api', {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        // mode: "no-cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "omit", // include, *same-origin, omit
        headers: {
          "Access-Control-Allow-Origin": "*",
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
    })
        .then(response => {
          return response.text();
        })
        .then(response => setData(response))
        .catch(err => setData("There was an error."));
  }

  return (
    <div className="App">
      <p></p>
      <textarea type="text" rows={12} value={input} onChange={e => setInput(e.target.value)} style={{width: '600px'}} />
      <p></p>
      <button onClick={submitData}>Submit</button>
      <p>{data}</p>
    </div>
  );
}

export default App;
