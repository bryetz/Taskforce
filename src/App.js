import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa'; // Importing the paper plane icon from react-icons
import './App.css';

function App() {
  const [data, setData] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const examplePrompts = [
    "Analyze the latest market trends for Nvidia, ServiceNow, and AMD and summarize key factors that could influence their stock performance in the upcoming quarter.",
    "Generate a template for a monthly newsletter that highlights company updates, industry news, and features a spotlight on a standout employee or customer story.",
    "Develop a week-long itinerary for a business trip to New York City that balances client meetings, networking events, and personal downtime effectively.",
    "Outline the steps required to migrate a small business's customer database from a local server to a cloud-based solution, ensuring minimal service disruption."
  ];

  const submitData = (prompt = input) => {
    setIsLoading(true);
    setData("");
    fetch('http://127.0.0.1:5000/api', {
      method: "POST",
      headers: {
        "Content-Type": 'application/json',
      },
      body: JSON.stringify(prompt)
    })
    .then(response => response.text())
    .then(response => {
      setData(response);
      setIsLoading(false);
    })
    .catch(err => {
      setData("There was an error processing your request.");
      setIsLoading(false);
    });
  }

  const setExampleInputAndSubmit = (prompt) => {
    setInput(prompt);
    submitData(prompt);
  }

  return (
    <div className="App">
      <div className="App-banner">TaskForces.ai</div>
      <header className="App-header">
        <h1>How can I help you today?</h1>
      </header>
      <div className="Prompt-buttons">
        {examplePrompts.map((prompt, index) => (
          <button key={index} onClick={() => setExampleInputAndSubmit(prompt)} className="Prompt-button">
            {prompt}
          </button>
        ))}
      </div>
      <div className="Input-container">
        <textarea 
          className="Input-area"
          placeholder="Or type your question here..." 
          rows={4} 
          value={input} 
          onChange={e => setInput(e.target.value)}
        />
        <FaPaperPlane className="Submit-icon" onClick={() => submitData()} />
      </div>
      <div className="Response-area">{isLoading ? 'Loading...' : data}</div>
    </div>
  );
}

export default App;
