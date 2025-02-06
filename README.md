# Local Ollama Vscode Extension

<img src="media/ottollama.png" alt="Ollama Logo" width="200"/>

## Description
Local Ollama Extension is a Visual Studio Code extension that allows users to interact with the Ollama API directly from the VS Code interface. This extension provides a seamless way to send prompts and receive responses, making it easier to integrate Ollama's capabilities into your development workflow.

## Features
- **Start the Ollama Extension**: Use the command `OTTOLLAMA` to start the extension.
- **Send Prompts**: Easily send prompts to the Ollama API and receive responses.
- **Chat History**: View and manage your chat history.
- **Model Selection**: Choose from a list of available models to use for your prompts.

## Requirements
- Visual Studio Code ^1.96.0
- Node.js ^14.0.0
- Ollama API running locally or accessible via a specified base URL

## Installation

### Ollama API
1. **Download and install Ollama**:
    Follow the instructions at [Ollama Download](https://ollama.com/download).
2. **Pull the desired models**:
    Visit [Ollama Library](https://ollama.com/library) and pull the models you need, paying attention to CPU and GPU requirements.

### Local Ollama Extension
1. **Clone the repository**:
    ```sh
    git clone https://github.com/erdincyasar/ottollama.git
    cd ottollama-extension
    ```
2. **Install dependencies**:
    ```sh
    npm install
    ```
3. **Compile the extension**:
    ```sh
    npm run compile
    ```
4. **Open the project in VS Code**:
    ```sh
    code .
    ```
5. **Start debugging**:
    Press `F5` to start debugging the extension.

## Usage
1. **Open the Command Palette**:
    Use `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the command palette.
2. **Start the Extension**:
    Type `OTTOLLAMA` and select the command to start the extension.
3. **Interact with Ollama**:
    - Enter your prompt in the input field.
    - Select the model you want to use.
    - Click the send button to receive a response.

## Contributing
We welcome contributions from the community! If you have ideas for new features, bug fixes, or improvements, please feel free to submit an issue or a pull request. Here are some ways you can contribute:
- **Report Bugs**: If you find a bug, please report it by opening an issue.
- **Suggest Features**: If you have an idea for a new feature, please let us know by opening an issue.
- **Submit Pull Requests**: If you want to contribute code, please fork the repository and submit a pull request.

## License
This project is licensed under the Apache License 2.0. See the [LICENSE](./LICENSE) file for details.

## Contact
If you have any questions or need further assistance, feel free to reach out to the project maintainers.

Thank you for using the Local Ollama Extension! We hope you find it useful and look forward to your contributions.
