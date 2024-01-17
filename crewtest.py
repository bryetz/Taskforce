import gradio as gr
from crewai import Agent, Task, Crew
from langchain.llms import Ollama
from langchain.tools import DuckDuckGoSearchRun
from langchain.agents import load_tools

# Initialize Ollama
ollama_llm = Ollama(model="openhermes")

def process_input(input_data):
    debug_info = []  # Collect debugging information
    try:
        lines = input_data.split('\n')
        agents = {}
        tasks = []
        search_tool = DuckDuckGoSearchRun()

        for line in lines:
            debug_info.append(f"Processing line: {line}")
            parts = line.split(';')
            debug_info.append(f"Split parts: {parts}")

            if line.startswith("Agent:") and len(parts) >= 3:
                role = parts[0].split(':')[1].strip()  # Corrected index for role
                goal = parts[1].strip()
                backstory = parts[2].strip() if len(parts) > 2 else "N/A"
                agents[role] = Agent(
                    role=role,
                    goal=goal,
                    backstory=backstory,
                    verbose=True,
                    allow_delegation=False,
                    llm=ollama_llm
                )
                debug_info.append(f"Created Agent: {role}")

            elif line.startswith("Task:") and len(parts) >= 2:
                agent_role = parts[0].split(':')[1].strip()  # Correctly identify the agent's role for the task
                description = parts[1].strip()
                agent = agents.get(agent_role)
                if agent:
                    tasks.append(Task(description=description, agent=agent))
                    debug_info.append(f"Created Task for {agent_role}: {description}")

        if not agents or not tasks:
            debug_str = "\n".join(debug_info)
            return f"No valid agents or tasks were created. Please check the input format.\nDebug info:\n{debug_str}"

        crew = Crew(agents=list(agents.values()), tasks=tasks, verbose=2)
        result = crew.kickoff()
        return str(result)
    except Exception as e:
        debug_str = "\n".join(debug_info)
        return f"Error: {e}\nDebug info:\n{debug_str}"

iface = gr.Interface(
    fn=process_input,
    inputs=gr.TextArea(placeholder="Enter agent and task data. Format:\nAgent: Role; Goal; Backstory (optional)\nTask: Agent's Role; Task Description"),
    outputs="text"
)

iface.launch()
