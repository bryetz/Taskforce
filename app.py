from flask import Flask, request
from flask_cors import CORS
from crewai import Agent, Task, Crew
from langchain.llms import Ollama
from langchain.tools import DuckDuckGoSearchRun
import re

ollama_llm = Ollama(model="openhermes")
search_tool = DuckDuckGoSearchRun()

app = Flask(__name__)
CORS(app)

@app.route("/api", methods=['POST'])
def input():
    debug_info = []  # Declare debug_info at the start
    try:
        # Extract prompt from the request data
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
            f"Every line in the response MUST start with 'Agent:' or 'Task:'"
            f"Lines should not be numbered, bulleted, or starred in order to be parsable.\n\n"
            f"REQUIRED Response format (SHOULD CONTAIN ONLY THIS AND NOTHING ELSE):"
            f"Agent: [Role]; [Goal]; [Backstory]"
            f"... (additional agents as necessary)"
            f"Task: [Agent's Role]; [Task Description]"
            f"... (additional tasks as necessary, each building upon the last)"
        )

        generation_result = ollama_llm.generate([instruction])
        print("Generation: ", generation_result)

        generated_text = ''.join(chunk.text for chunk in generation_result.generations[0])
        print("Generated Text: ", generated_text)

        # Use regular expressions to split the generated text into lines
        lines = re.split(r'\r?\n', generated_text)
        agents = {}
        tasks = []

        for line in lines:
            debug_info.append(f"Processing line: {line}")
            if line.startswith("Agent:"):
                parts = line.split(';')
                if len(parts) >= 3:
                    role = parts[0].split(':')[1].strip()
                    goal = parts[1].strip()
                    backstory = parts[2].strip()
                    agents[role] = Agent(
                        role=role,
                        goal=goal,
                        backstory=backstory,
                        verbose=True,
                        allow_delegation=False,
                        tools=[search_tool],
                        llm=ollama_llm
                    )
                    debug_info.append(f"Created Agent: {role}")
            elif line.startswith("Task:"):
                parts = line.split(';')
                if len(parts) >= 2:
                    agent_role = parts[0].split(':')[1].strip()
                    description = parts[1].strip()
                    agent = agents.get(agent_role)
                    if agent:
                        tasks.append(Task(description=description, agent=agent))
                        debug_info.append(f"Created Task for {agent_role}: {description}")

        if not agents or not tasks:
            debug_str = "\n".join(debug_info)
            return f"No valid agents or tasks were created. Please check the input format.\nDebug info:\n{debug_str}"

        # Process agents and tasks with Crew library
        crew = Crew(agents=list(agents.values()), tasks=tasks, verbose=2)
        result = crew.kickoff()
        return result

    except Exception as e:
        debug_str = "\n".join(debug_info) if debug_info else "No debug info available."
        return f"Error: {e}\nDebug info:\n{debug_str}"

if __name__ == "__main__":
    app.run()