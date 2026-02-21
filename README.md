# VantageUEFI-AI - Modern EDK II Expert v0.3.0

<div align="center">
  <img src="resources/vantage-uefi-ai-logo.png" alt="VantageUEFI-AI Logo" width="200">
  
  **Advanced AI-driven analysis for modern EDK II firmware development**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![VS Code](https://img.shields.io/badge/VS%20Code-Extension-blue)](https://code.visualstudio.com/)
  [![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-green)](https://ollama.ai/)
</div>

---

**VantageUEFI-AI** is an advanced VS Code extension designed for **Modern EDK II** firmware development. It brings the power of local LLMs (via Ollama) directly into your firmware workflow with specialized focus on LibraryClass optimization and silicon-agnostic design from a Senior BIOS Architect's perspective.

## 🚀 What's New in v0.2.0

### � VantageUEFI-AI Rebranding
- **New Brand Identity**: Rebranded from OmniLocal AI to **VantageUEFI-AI**
- **Enhanced Positioning**: Advanced AI-driven analysis with Senior BIOS Architect perspective
- **Modern EDK II Focus**: Strengthened emphasis on modern EDK II standards and UEFI 2.10 compliance
- **Professional Image**: Elevated brand positioning as expert-level firmware analysis tool

### �� Enhanced User Experience
- **📝 Collapsible Code Sections**: Original Code now defaults to hidden for better focus on analysis
- **🔄 Interactive UI**: Click-to-expand/collapse with smooth animations and visual indicators
- **🎯 Improved Workflow**: Direct access to analysis results without scrolling through source code
- **🐛 Character Display Fix**: Complete resolution of HTML entity issues (`->`, `<`, `>` now display correctly)

### 🔧 Technical Improvements
- **Multi-layer Decoding**: HTML entity decoding at TypeScript, JavaScript, and Markdown levels
- **Enhanced Streaming**: Real-time analysis updates with proper character encoding
- **Theme Integration**: Full VS Code theme support for consistent appearance
- **Space Optimization**: Better panel utilization for smaller screens

---

## 🌟 The Vantage Advantage

### 🏔️ From Vendor-Lock to EDK II Portability

**VantageUEFI-AI** specializes in transforming vendor-specific, locked firmware code into portable, modern EDK II modules. Our Senior BIOS Architect perspective helps you:

#### **🔓 Break Vendor Dependencies**
- **Identify Silicon-Specific Code**: Detect hardcoded register access and vendor-specific implementations
- **Suggest Industry Standards**: Replace custom protocols with standard UEFI protocols (PciIo, DevicePath, etc.)
- **Modernize Legacy Code**: Update outdated practices to current UEFI 2.10 standards

#### **📚 Leverage EDK II LibraryClasses**
- **MdePkg & MdeModulePkg Priority**: Automatically suggest standard LibraryClasses over custom implementations
- **Missing Include Detection**: Identify and recommend missing `#include <Library/BaseLib.h>` statements
- **Code Refactoring**: Show exact replacements for custom logic with standard Library functions

#### **🌐 Achieve Silicon-Agnostic Design**
- **Cross-Platform Compatibility**: Ensure your firmware works across different CPUs and chipsets
- **Protocol-Based Architecture**: Design using industry-standard protocols instead of direct hardware access
- **PCD Utilization**: Leverage Platform Configuration Database for platform-specific settings

#### **🎯 Modern EDK II Standards**
- **SafeString Functions**: Replace unsafe string functions with StrCpyS, UnicodeSPrint, etc.
- **UEFI 2.10 Compliance**: Ensure adherence to the latest UEFI specifications
- **Best Practices**: Follow contemporary EDK II coding standards and patterns

---

## 🚀 Key Features

### 📚 **LibraryClass Expertise**
- **MdePkg & MdeModulePkg Priority**: Automatically suggests standard EDK II LibraryClasses (BaseLib, MemoryAllocationLib, PrintLib, PcdLib, UefiLib, etc.)
- **Missing Include Detection**: Identifies and recommends missing `#include <Library/BaseLib.h>` statements
- **Code Refactoring**: Shows how to replace custom logic with standard Library functions
- **Best Practices**: Guides toward Modern EDK II standards and SafeString functions

### 🔧 **Silicon-Agnostic Design**
- **Hardware Independence**: Detects silicon-specific hardcoding and suggests portable Protocol-based alternatives
- **Industry Standards**: Recommends PciIo, DevicePath, and other standard protocols over direct register access
- **Cross-Platform Compatibility**: Ensures your firmware works across different CPUs and chipsets

### 🛡️ **Security-First Analysis**
- **EFI_STATUS Validation**: Comprehensive return value checks and error handling
- **SMM Safety**: System Management Mode security best practices
- **Buffer Overflow Prevention**: Memory safety analysis and recommendations
- **Null Pointer Protection**: Advanced pointer safety checks

### 🌐 **Omni-Language Support**
- **EDK II Files**: `.c`, `.cpp`, `.h`, `.hpp` with specialized firmware analysis
- **Build Files**: `.dsc`, `.dec`, `.fdf`, `.inf` with LibraryInstance and PCD validation
- **UI Files**: `.vfr` (Visual Forms Representation) analysis
- **Low-Level**: `.asl` (ACPI), `.s` (Assembly), `.py` (Python scripts), `.bat` (batch files)

### 🔒 **100% Private Processing**
- **Local Ollama**: Your sensitive BIOS source code never leaves your machine
- **No Cloud Dependencies**: Complete offline capability for secure development
- **Privacy-First**: Perfect for proprietary firmware development

### 🎨 **Professional Interface**
- **Modern UI**: Collapsible sections with smooth animations
- **VS Code Integration**: Seamless theme adaptation and native feel
- **Focus-Oriented**: Analysis results prioritized, code view on-demand
- **Interactive Elements**: Hover effects, toggle indicators, and responsive design

---

## 📦 Installation

### Prerequisites
- Visual Studio Code 1.80.0+
- Local Ollama installation
- qwen2.5-coder:7b model (recommended for firmware analysis)

### Quick Start
1. **Install Ollama**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama**
   ```bash
   ollama serve
   ```

3. **Pull Model**
   ```bash
   ollama pull qwen2.5-coder:7b
   ```

4. **Install Extension**
   - From VS Code Marketplace: Search "VantageUEFI-AI"
   - Or install from VSIX: `code --install-extension vantage-uefi-ai-0.2.0.vsix`

### Usage
1. Open EDK II firmware file in VS Code
2. Select code to analyze (or use entire file)
3. Right-click → "Analyze with VantageUEFI-AI"
4. View expert analysis in side panel with Senior BIOS Architect insights

---

## ⚙️ Configuration

### Settings
```json
{
  "vantageUefi.model": "qwen2.5-coder:7b"
}
```

### Supported Models
- **qwen2.5-coder:7b** (recommended)
- **codestral**
- Other Ollama-compatible models

---

## 🔧 Development

### Repository
- **Main Repository**: https://github.com/leoliao1980/vantage-uefi-ai
- **Issues**: https://github.com/leoliao1980/vantage-uefi-ai/issues
- **License**: MIT License

### Building
```bash
# Clone repository
git clone https://github.com/leoliao1980/vantage-uefi-ai.git
cd vantage-uefi-ai

# Install dependencies
npm install

# Compile
npm run compile

# Package
npx @vscode/vsce package
```

---

## 🎯 The Vantage Difference

### 🏔️ Expert-Level Analysis
Unlike generic code analysis tools, VantageUEFI-AI provides:
- **Senior BIOS Architect Perspective**: Strategic insights from firmware architecture viewpoint
- **UEFI 2.10 Standards Compliance**: Evaluation against latest specifications
- **Modern EDK II Best Practices**: Contemporary firmware development standards

### 🔓 Vendor-Lock Transformation
- **Identify Dependencies**: Detect vendor-specific implementations
- **Suggest Alternatives**: Recommend standard EDK II LibraryClasses
- **Portability Enhancement**: Transform locked code into portable modules

### 🌐 Silicon-Agnostic Design
- **Cross-Platform Compatibility**: Ensure firmware works across different platforms
- **Industry Standards**: Leverage standard protocols over hardware-specific code
- **Modern Architecture**: Protocol-based design patterns

---

## 📋 Supported File Types

### EDK II Source Files
- **C/C++**: `.c`, `.cpp`, `.h`, `.hpp` - Firmware source code
- **Build Files**: `.dsc`, `.dec`, `.fdf`, `.inf` - EDK II build configuration
- **UI Files**: `.vfr` - Visual Forms Representation
- **ACPI**: `.asl` - ACPI Source Language
- **Assembly**: `.s` - Low-level assembly code

### Development Scripts
- **Python**: `.py` - Build and utility scripts
- **Batch**: `.bat` - Windows build scripts

---

## 🛡️ Privacy & Security

### 100% Local Processing
- **No Cloud Dependencies**: All analysis happens locally
- **Source Code Privacy**: Your firmware never leaves your machine
- **Enterprise Ready**: Perfect for proprietary firmware development

### Security Best Practices
- **SMM Safety**: System Management Mode security analysis
- **Buffer Protection**: Memory safety recommendations
- **Status Validation**: Comprehensive EFI_STATUS checking

---

## 🔮 Roadmap

### Planned Features
- [ ] Advanced LibraryClass mapping suggestions
- [ ] PCD usage optimization recommendations
- [ ] Integration with EDK II build tools
- [ ] Custom firmware rule configuration
- [ ] Batch analysis for entire modules
- [ ] Historical analysis tracking

### Improvements
- [ ] Enhanced Protocol recommendations
- [ ] More comprehensive LibraryClass database
- [ ] Performance optimizations for large codebases
- [ ] Additional AI model fine-tuning
- [ ] Industry-specific firmware standards

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Copyright
```
Copyright (c) 2026 Hsien-Chung, Liao (Leo Liao)
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/leoliao1980/vantage-uefi-ai/issues)
- **Email**: hsienchung.liao@gmail.com
- **VS Code Marketplace**: [VantageUEFI-AI Extension](https://marketplace.visualstudio.com/items?itemName=leo-liao.vantage-uefi-ai)

---

<div align="center">

**🏔️ Transform your firmware development with VantageUEFI-AI**

*From vendor-lock to portable EDK II modules*

[⭐ Star this repo](https://github.com/leoliao1980/vantage-uefi-ai) | [🔧 Report Issues](https://github.com/leoliao1980/vantage-uefi-ai/issues) | [📧 Contact Author](mailto:hsienchung.liao@gmail.com)

</div>

## 🛠 Prerequisites
1. Install [Ollama](https://ollama.ai/).
2. Pull a coding model: `ollama pull qwen2.5-coder:7b`.