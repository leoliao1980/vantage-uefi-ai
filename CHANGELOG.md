# Changelog

All notable changes to the VantageUEFI-AI extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-21

### 🎉 VantageUEFI-AI Rebranding Release

#### ✨ Major Rebranding
- **New Brand Identity**: Rebranded from OmniLocal AI to **VantageUEFI-AI**
- **Enhanced Positioning**: Advanced AI-driven analysis with Senior BIOS Architect perspective
- **Modern EDK II Focus**: Strengthened emphasis on modern EDK II standards and UEFI 2.10 compliance
- **Professional Image**: Elevated brand positioning as expert-level firmware analysis tool

#### 🔧 Logic Enhancement
- **Vantage Perspective**: System prompt updated with Senior BIOS Architect viewpoint
- **UEFI 2.10 Standards**: Explicit evaluation against latest UEFI specifications
- **Library Resource Priority**: Enhanced focus on leveraging existing EDK II Library resources
- **Vendor-Lock Transformation**: Specialized analysis for converting vendor-specific code to portable EDK II modules

#### 🎨 User Experience Enhancement
- **Collapsible Code Sections**: Original Code section now defaults to hidden state for better focus on analysis results
- **Interactive UI Elements**: Click-to-expand/collapse functionality with smooth animations and visual indicators
- **Enhanced Display**: Improved visual hierarchy with toggle icons (▼/◀) and hover effects
- **Space Optimization**: Better utilization of panel space, especially important for smaller screens or side-by-side editing

#### 🔧 Technical Improvements
- **HTML Entity Decoding**: Complete fix for Ollama's escaped characters in both streaming and static analysis
- **Multi-layer Decoding**: HTML entity decoding at TypeScript, JavaScript, and Markdown parsing levels
- **Consistent Rendering**: Proper display of C language operators (->, <, >, &, ", ') in all contexts
- **Enhanced Streaming**: Real-time analysis updates with correct syntax highlighting

#### 📦 Configuration Updates
- **New Configuration Prefix**: Changed from `omnilocal.*` to `vantageUefi.*`
- **Command Update**: Command ID updated to `vantageUefi.analyze`
- **Enhanced Description**: Configuration description now emphasizes EDK II analysis focus

#### 🎯 The Vantage Advantage
- **Vendor-Lock Breakthrough**: Specialized capability to transform vendor-specific code into portable EDK II modules
- **Silicon-Agnostic Design**: Enhanced focus on cross-platform compatibility and industry-standard protocols
- **Modern Standards Compliance**: UEFI 2.10 and contemporary EDK II best practices
- **Expert-Level Analysis**: Senior BIOS Architect perspective for professional firmware development

#### 🐛 Bug Fixes
- **HTML Entity Display**: Fixed `&gt;`, `&lt;`, `&amp;` appearing in analysis results instead of proper symbols
- **Streaming Consistency**: Ensured streaming updates maintain proper character encoding
- **Markdown Parsing**: Resolved conflicts between HTML entities and marked.js processing
- **Cross-Platform Rendering**: Consistent display across different operating systems and VS Code themes

#### 📦 Technical Specifications
- **Collapsible System**: CSS-based collapsible sections with JavaScript toggle functionality
- **Entity Decoding**: Three-layer decoding (TypeScript → JavaScript → Markdown)
- **Animation Support**: Smooth CSS transitions for expand/collapse operations
- **Theme Integration**: Full VS Code theme variable support for consistent appearance

#### 🎯 User Benefits
- **Improved Workflow**: Direct access to analysis without scrolling through source code
- **Better Focus**: Analysis results prioritized for faster decision-making
- **Clean Interface**: Reduced visual clutter with on-demand code viewing
- **Professional Experience**: Modern, responsive UI that matches VS Code design language
- **Expert Analysis**: Senior BIOS Architect perspective for professional-grade insights

---

## [0.1.0] - 2026-02-21

### 🎉 Professional EDK II Firmware Expert Release (as OmniLocal AI)

#### ✨ Enhanced Features
- **LibraryClass Optimization**: Advanced detection and recommendations for MdePkg & MdeModulePkg LibraryClasses
- **Missing Include Detection**: Automatically suggests missing `#include <Library/BaseLib.h>` statements
- **Silicon-Agnostic Design**: Hardware independence analysis with Protocol-based alternatives
- **Modern EDK II Standards**: SafeString functions and contemporary firmware practices
- **Multi-Language Support**: Extended support for EDK II build files (.dsc, .dec, .fdf, .inf) and UI files (.vfr)

#### 🔧 Core Functionality
- **MdePkg & MdeModulePkg Priority**: Specialized focus on standard EDK II LibraryClasses
- **Code Refactoring**: Specific suggestions for replacing custom logic with Library functions
- **Header Suggestions**: Exact include statements and LibraryClass names for .c files
- **Cross-Platform Analysis**: Ensuring firmware works across different CPUs and chipsets
- **Security Best Practices**: EFI_STATUS validation, SMM safety, and buffer overflow prevention

#### 🎨 Professional Features
- **Context Menu Integration**: Right-click analysis for all supported firmware file types
- **Real-Time Streaming**: Live analysis updates with model information display
- **Privacy-First**: Complete local Ollama processing for secure firmware development
- **Flexible Configuration**: Customizable AI models and analysis parameters

#### 📦 Technical Specifications
- **Supported File Types**: `.c`, `.cpp`, `.h`, `.hpp`, `.dsc`, `.dec`, `.fdf`, `.inf`, `.vfr`, `.asl`, `.s`, `.py`, `.bat`
- **AI Models**: qwen2.5-coder:7b (recommended), codestral, and other Ollama-compatible models
- **Analysis Focus**: LibraryClass reuse, silicon-agnostic design, security best practices
- **Privacy**: 100% local processing, no cloud dependencies

#### 🎯 EDK II Specialization
- **LibraryClass Expertise**: BaseLib, MemoryAllocationLib, PrintLib, PcdLib, UefiLib, DevicePathLib
- **Modern Standards**: SafeString functions, contemporary error handling, PCD utilization
- **Build System Analysis**: DSC/DEC/FDF file validation with LibraryInstance mapping
- **Protocol Recommendations**: Industry standard protocols over direct hardware access

#### 🔍 Analysis Capabilities
- **Missing Library Detection**: Identifies opportunities for LibraryClass usage
- **Include Statement Suggestions**: Exact header file recommendations
- **Code Modernization**: Guides toward current EDK II best practices
- **Portability Analysis**: Hardware-agnostic design recommendations
- **Security Validation**: Comprehensive firmware security assessment

---

## 🚀 Getting Started

### Prerequisites
- Visual Studio Code 1.80.0+
- Local Ollama installation
- qwen2.5-coder:7b model (recommended for firmware analysis)

### Installation
1. Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
2. Start Ollama: `ollama serve`
3. Pull model: `ollama pull qwen2.5-coder:7b`
4. Install extension from VS Code Marketplace

### Usage
1. Open EDK II firmware file in VS Code
2. Select code to analyze
3. Right-click → "Analyze with VantageUEFI-AI"
4. View professional firmware analysis in side panel

---

## 🔮 Future Roadmap

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

**For detailed usage instructions and troubleshooting, see the [README.md](README.md).**
