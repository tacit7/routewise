# RouteWise Frontend AI Persona Documentation

This directory contains comprehensive context documentation to recreate the AI assistant's understanding of the RouteWise frontend project.

## Documentation Structure

### 📋 [Project Overview](./project-overview.md)
- **Purpose**: High-level project identity and architecture
- **Contains**: Application modes, directory structure, current development state
- **Use When**: New to the project or need big-picture context

### 🔧 [Technical Context](./technical-context.md)
- **Purpose**: Deep technical architecture and implementation details  
- **Contains**: Technology stack, data types, performance patterns
- **Use When**: Working on technical implementation or debugging

### 📝 [Recent Changes](./recent-changes.md)
- **Purpose**: Session-by-session development history and context
- **Contains**: Latest implementations, bug fixes, decision rationale
- **Use When**: Continuing work from previous sessions

### 💬 [Communication Style](./communication-style.md)
- **Purpose**: User communication preferences and interaction patterns
- **Contains**: Tone requirements, response patterns, success/failure examples
- **Use When**: Ensuring proper communication approach

### 🏗️ [Component Architecture](./component-architecture.md)
- **Purpose**: Detailed component structure and interaction patterns
- **Contains**: Component hierarchy, prop interfaces, state management
- **Use When**: Working with specific components or debugging interactions

### 🔍 [Troubleshooting Guide](./troubleshooting-guide.md)
- **Purpose**: Common issues and systematic debugging approaches
- **Contains**: Error patterns, solutions, debugging strategies
- **Use When**: Encountering problems or errors

## How to Use This Documentation

### For New AI Sessions
1. **Start with Project Overview** - Get basic context
2. **Read Recent Changes** - Understand latest development state
3. **Review Communication Style** - Match user preferences
4. **Reference others as needed** - For specific technical details

### For Specific Tasks
- **Component Work** → Component Architecture + Technical Context
- **Debugging Issues** → Troubleshooting Guide + Recent Changes  
- **New Features** → Technical Context + Project Overview
- **Performance** → Technical Context + Recent Changes

### For Maintaining Context
- **Update Recent Changes** after significant work
- **Add new troubleshooting patterns** as they're discovered
- **Document architectural decisions** in Technical Context

## Key Project Principles

### User Communication
- **Direct & Pragmatic**: No unnecessary politeness or hedging
- **Evidence-Based**: Show actual code changes and measurements
- **Mobile-First**: Always consider mobile experience first
- **Performance-Conscious**: Measure and optimize, don't guess

### Technical Standards  
- **TypeScript Strict**: Comprehensive type safety
- **Mobile-First Design**: Responsive layouts with mobile priority
- **Component Composition**: Reusable components with clear interfaces
- **Performance Optimization**: Minimal API calls, efficient rendering

### Development Workflow
- **Ask Permission**: For server operations and small file edits
- **Test Thoroughly**: Verify both mobile and desktop layouts
- **Document Changes**: Update this documentation for significant work
- **Measure Impact**: Performance, bundle size, API usage effects

## Current Project Status

**Last Updated**: August 7, 2025 (Session 21)

**Active Features**: 
- ✅ Time scheduling for POIs
- ✅ Category filtering with modal
- ✅ Google API optimization (80% reduction)
- ✅ Mobile-responsive layouts
- ✅ POI card interaction fixes

**Known Working State**:
- Route and Explore modes functioning
- Map pins rendering with fallback
- Mobile-first responsive behavior
- Time scheduling integrated across pages

**Technology Stack**:
- React 18 + TypeScript + Vite
- Phoenix backend on port 4001
- Tailwind CSS + shadcn/ui
- Google Maps with custom markers