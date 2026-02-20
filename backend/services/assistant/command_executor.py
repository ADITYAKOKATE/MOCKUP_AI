import json

def execute_command(llm_response: str):
    """
    Parses LLM response for JSON commands and executes them.
    Returns (cleaned_response, command_result_dict)
    """
    command = None
    clean_text = llm_response
    
    try:
        if "```json" in llm_response:
            json_str = llm_response.split("```json")[1].split("```")[0]
            command = json.loads(json_str)
            # Remove the JSON block from the spoken response
            clean_text = llm_response.replace(f"```json{json_str}```", "").strip()
    except:
        pass
        
    return clean_text, command

def get_platform_actions():
    return {
        "start_test": "Navigates to test screen",
        "show_analysis": "Shows performance graphs",
        "fetch_weak_areas": "Lists weak topics"
    }
