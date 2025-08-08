# Testing Guide for RouteWise

This document provides a comprehensive guide to the testing strategy implemented for RouteWise, including setup instructions, testing types, and best practices.

## Testing Stack

- **Unit/Integration Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Performance Tests**: Lighthouse + K6
- **Accessibility Tests**: axe-core + Playwright
- **API Tests**: Supertest + MSW (Mock Service Worker)

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm run test:all

# Run specific test types
npm test                    # Unit/integration tests
npm run test:e2e           # End-to-end tests
npm run test:performance   # Performance tests
npm run test:a11y          # Accessibility tests
```

## Test Structure

```
test/
├── client/                 # Frontend component tests
│   ├── components/         # React component tests
│   └── hooks/             # Custom hook tests
├── server/                # Backend API tests
├── e2e/                   # End-to-end test scenarios
│   ├── auth/              # Authentication flows
│   ├── routes/            # Route planning workflows
│   └── pois/              # POI discovery features
├── performance/           # Performance and load tests
├── accessibility/         # Accessibility compliance tests
└── setup.ts              # Test configuration
```

## Testing Guidelines

### Unit Tests
- Test individual components and functions in isolation
- Use React Testing Library for component testing
- Mock external dependencies and API calls
- Aim for 90%+ test coverage

### Integration Tests
- Test component interactions and data flow
- Test API endpoints with realistic scenarios
- Use MSW for API mocking
- Test error handling and edge cases

### E2E Tests
- Test complete user journeys
- Cover critical business flows
- Test across different browsers and devices
- Include authentication and authorization scenarios

### Performance Tests
- Monitor Core Web Vitals (LCP, FID, CLS)
- Set performance budgets and thresholds
- Test under various network conditions
- Monitor bundle size and resource usage

### Accessibility Tests
- Ensure WCAG 2.1 AA compliance
- Test keyboard navigation
- Verify screen reader compatibility
- Check color contrast and focus management

## Test Scripts

### Unit and Integration Tests
```bash
npm test                    # Run tests in watch mode
npm run test:ui            # Run with Vitest UI
npm run test:coverage      # Generate coverage report
```

### End-to-End Tests
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Run with Playwright UI
npx playwright test --headed  # Run in headed mode
```

### Performance Tests
```bash
npm run test:performance          # Run all performance tests
npm run test:performance:lighthouse  # Lighthouse only
npm run test:performance:load     # Load testing only
npm run test:performance:bundle   # Bundle analysis only
```

### Accessibility Tests
```bash
npm run test:a11y          # Run accessibility tests
npm run test:a11y:report   # Generate HTML report
```

## CI/CD Integration

The testing pipeline runs automatically on:
- Every push to main/develop branches
- Every pull request
- Scheduled nightly runs for performance regression testing

### Pipeline Stages
1. **Lint & Type Check** - Code quality validation
2. **Unit Tests** - Component and function testing
3. **E2E Tests** - User journey validation
4. **Performance Tests** - Core Web Vitals and load testing
5. **Accessibility Tests** - WCAG compliance validation
6. **Security Scan** - Vulnerability assessment
7. **Build & Deploy** - Artifact creation and deployment

## Performance Thresholds

### Core Web Vitals
- **First Contentful Paint (FCP)**: ≤ 1.5s
- **Largest Contentful Paint (LCP)**: ≤ 2.5s
- **Cumulative Layout Shift (CLS)**: ≤ 0.1
- **First Input Delay (FID)**: ≤ 100ms

### Bundle Size
- **JavaScript Bundle**: ≤ 500KB
- **CSS Bundle**: ≤ 100KB
- **Total Page Size**: ≤ 2MB

### Load Testing
- **Response Time (95th percentile)**: ≤ 2s
- **Error Rate**: ≤ 10%
- **Concurrent Users**: Support 50+ users

## Accessibility Standards

### WCAG 2.1 AA Requirements
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader**: Proper semantic markup and ARIA labels
- **Focus Management**: Visible focus indicators and logical tab order

### Testing Checklist
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Headings follow proper hierarchy (h1 → h2 → h3)
- [ ] Interactive elements are keyboard accessible
- [ ] Color is not the only means of conveying information
- [ ] Text meets minimum contrast ratios
- [ ] Page has proper landmarks (main, nav, etc.)

## Debugging Tests

### Common Issues
1. **Flaky E2E Tests**: Use proper wait conditions and stable selectors
2. **Slow Performance Tests**: Check for memory leaks and optimize bundle size
3. **Accessibility Failures**: Review ARIA labels and semantic markup
4. **API Test Failures**: Verify mock data and endpoint configurations

### Debug Commands
```bash
# Debug E2E tests
npx playwright test --debug
npx playwright test --headed --slowMo=1000

# Debug unit tests
npm test -- --no-coverage --reporter=verbose

# Debug performance
npm run test:performance:lighthouse -- --verbose
```

## Best Practices

### Writing Tests
1. **Descriptive Test Names**: Clearly state what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear phases
3. **Test User Behavior**: Focus on user interactions, not implementation
4. **Avoid Test Pollution**: Ensure tests don't affect each other
5. **Use Page Object Model**: Organize E2E tests with reusable page objects

### Maintaining Tests
1. **Keep Tests Updated**: Update tests when features change
2. **Remove Obsolete Tests**: Delete tests for removed features
3. **Regular Review**: Periodically review test coverage and quality
4. **Performance Monitoring**: Track test execution time and optimize slow tests

## Continuous Improvement

### Metrics to Monitor
- Test coverage percentage
- Test execution time
- Flaky test rate
- Performance regression trends
- Accessibility compliance score

### Regular Tasks
- Weekly review of test results and failures
- Monthly performance baseline updates
- Quarterly accessibility audit
- Annual testing strategy review

For questions or issues with testing, please refer to the [troubleshooting guide](./FAQ.md) or open an issue in the repository.