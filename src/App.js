import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import './App.css';

function createKey() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function AgentRow(props) {
  return (
    <div className="agent-row">
      <input value="AGENT" disabled style={{ height: '50px', textAlign: 'center' }} />
      <textarea placeholder="Role" value={props.role} onChange={(e) => props.updateAgent(props.id, 'role', e.target.value)} style={{ height: '50px' }} />
      <textarea placeholder="Goal" value={props.goal} onChange={(e) => props.updateAgent(props.id, 'goal', e.target.value)} style={{ height: '50px' }} />
      <textarea placeholder="Backstory" value={props.backstory} onChange={(e) => props.updateAgent(props.id, 'backstory', e.target.value)} style={{ height: '50px' }} />
      <span className="delete-icon" onClick={() => props.deleteAgent(props.id)}>X</span>
    </div>
  );
}

function TaskRow(props) {
  return (
    <div className="task-row">
      <input value="TASK" disabled style={{ height: '50px', textAlign: 'center' }} />
      <textarea placeholder="Role" value={props.role} onChange={(e) => props.updateTask(props.id, 'role', e.target.value)} style={{ height: '50px' }} />
      <textarea placeholder="Description" value={props.description} onChange={(e) => props.updateTask(props.id, 'description', e.target.value)} style={{ height: '50px' }} />
      <span className="delete-icon" onClick={() => props.deleteTask(props.id)}>X</span>
    </div>
  );
}

function App() {
  const [data, setData] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [agents, setAgents] = useState([
    {
      role: "",
      goal: "",
      backstory: "",
      id: createKey()
    }
  ]);
  const [tasks, setTasks] = useState([
    {
      role: "",
      description: "",
      id: createKey()
    }
  ]);

  const examplePrompts = [
    "Analyze the latest market trends for NVIDIA, ServiceNow, and AMD and summarize key factors that could influence their stock performance in the upcoming quarter.",
    "Generate a template for a monthly newsletter that highlights company updates, industry news, and features a spotlight on a standout employee or customer story.",
    "Develop a week-long itinerary for a business trip to New York City that balances client meetings, networking events, and personal downtime effectively.",
    "Outline the steps required to migrate a small business's customer database from a local server to a cloud-based solution, ensuring minimal service disruption."
  ];

  const submitData = (prompt = input) => {
    setIsLoading(true);
    setData("");
    fetch('http://127.0.0.1:5000/api/generate', {
      method: "POST",
      headers: {
        "Content-Type": 'application/json',
      },
      body: JSON.stringify(prompt)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(response => {
      setAgents(response.agents.map(agent => ({...agent, id: createKey()})));
      setTasks(response.tasks.map(task => ({...task, id: createKey()})));
      setIsLoading(false);
    })
    .catch(err => {
      console.error("Fetch error: ", err);
      setData("There was an error processing your request.");
      setIsLoading(false);
    });
};

  const processAgentsAndTasks = () => {
    // Send the agents and tasks back to the backend for final processing
    const data = { agents, tasks };
    fetch('http://127.0.0.1:5000/api/process', {
      method: "POST",
      headers: {
        "Content-Type": 'application/json',
      },
      body: JSON.stringify(data)
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
  };

  const setExampleInputAndSubmit = (prompt) => {
    setInput(prompt);
    submitData(prompt);
  }

  const addAgent = () => {
    setAgents([...agents, { id: createKey() }]);
  };

  const addTask = () => {
    setTasks([...tasks, { id: createKey() }]);
  };

  const deleteAgent = (id) => {
    setAgents(agents.filter((agent) => agent.id !== id));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const updateAgent = (id, prop, value) => {
    let updatedAgents = agents.map(agent => {
      if (agent.id === id) {
        return { ...agent, [prop]: value };
      }
      return agent;
    });
    setAgents(updatedAgents);
  };

  const updateTask = (id, prop, value) => {
    let updatedTasks = tasks.map(task => {
      if (task.id === id) {
        return { ...task, [prop]: value };
      }
      return task;
    });
    setTasks(updatedTasks);
  };

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

      <div>
        <h2>Agents</h2>
        {agents.map((agent) => (
          <AgentRow 
            key={agent.id}
            id={agent.id}
            role={agent.role}
            goal={agent.goal}
            backstory={agent.backstory}
            deleteAgent={deleteAgent}
            updateAgent={updateAgent}
          />
        ))}
        <button onClick={addAgent}>Add Agent +</button>
      </div>

      <div>
        <h2>Tasks</h2>
        {tasks.map((task) => (
          <TaskRow 
            key={task.id}
            id={task.id}
            role={task.role}
            description={task.description}
            deleteTask={deleteTask}
            updateTask={updateTask}
          />
        ))}
        <button onClick={addTask}>Add Task +</button>
      </div>

      {/* Button to process agents and tasks */}
      <button onClick={processAgentsAndTasks} className="Process-button">
        Process Agents and Tasks
      </button>
    </div>
  );
}

export default App;