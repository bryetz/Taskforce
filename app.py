from flask import Flask, request, jsonify
from flask_cors import CORS
from crewai import Agent, Task, Crew
from langchain.llms import Ollama
from langchain.tools import DuckDuckGoSearchRun
import re

# Initialize the Ollama model and search tool
ollama_llm = Ollama(model="openhermes")
search_tool = DuckDuckGoSearchRun()

# Create a Flask app and enable CORS
app = Flask(__name__)
CORS(app)

@app.route("/api/generate", methods=['POST'])
def generate():
    try:
        prompt = request.data.decode("utf-8").strip('"')
        print("Prompt: ", prompt)

        # Formulate the instruction for the Ollama model
        instruction = (
            f"Prompt: '{prompt}'\n"
            f"Based on the provided prompt, generate structured responses using multiple agents and tasks. "
            f"List all agents first, each defined by their Role, Goal, and Backstory. "
            f"Then list the tasks, with each task linked to an EXISTING agent's role and give each agent a task. "
            f"Ensure the tasks are sequential, each building on the previous, "
            f"leading to a final deliverable task that synthesizes all insights into a comprehensive and intelligent response. "
            f"Every line in the response MUST start with 'Agent:' or 'Task:'."
            f"Lines should not be numbered, bulleted, or starred in order to be parsable.\n\n"
            f"REQUIRED Response format (SHOULD CONTAIN ONLY THIS AND NOTHING ELSE):"
            f"Agent: [Role]; [Goal]; [Backstory]"
            f"... (additional agents as necessary)"
            f"Task: [Agent's Role]; [Task Description]"
            f"... (additional tasks as necessary, each building upon the last and corresponding to an agent above)"
        )

        generation_result = ollama_llm.generate([instruction])
        generated_text = ''.join(chunk.text for chunk in generation_result.generations[0])
        print("Generated Text: ", generated_text)

        # Split the generated text into lines and process them
        lines = re.split(r'\r?\n', generated_text)
        agents = {}
        tasks = []

        for line in lines:
            if line.startswith("Agent:"):
                parts = line.split(';')
                if len(parts) >= 3:
                    role = parts[0].split(':')[1].strip()
                    goal = parts[1].strip()
                    backstory = parts[2].strip()
                    agents[role] = {"role": role, "goal": goal, "backstory": backstory}
            elif line.startswith("Task:"):
                parts = line.split(';')
                if len(parts) >= 2:
                    agent_role = parts[0].split(':')[1].strip()
                    description = parts[1].strip()
                    # Add the task only if the corresponding agent role exists
                    if agent_role in agents:
                        tasks.append({"role": agent_role, "description": description})

        return jsonify({"agents": list(agents.values()), "tasks": tasks})

    except Exception as e:
        return f"Error: {e}"

@app.route("/api/process", methods=['POST'])
def process():
    data = request.json
    agents = [
        Agent(
            role=agent_data['role'],
            goal=agent_data['goal'],
            backstory=agent_data['backstory'],
            verbose=True,
            allow_delegation=False,
            tools=[search_tool],
            llm=ollama_llm
        ) for agent_data in data['agents']
    ]

    tasks = [Task(description=task_data['description'], agent=next(agent for agent in agents if agent.role == task_data['role'])) for task_data in data['tasks']]
    crew = Crew(agents=agents, tasks=tasks, verbose=2)
    result = crew.kickoff()
    return result

if __name__ == "__main__":
    app.run()