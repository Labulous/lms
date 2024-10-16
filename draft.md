**# Project overview**




**# Core functionalities**



**# Doc**




**# Current file structure**



**# Current file structure**


**# Additional requirements**
1. Project setup:
    - All new componenets should go in /components at the root (not in the app folder) and named like example-component.tsx unless otherwise specified
    - All new pages go in /app
    - Use the Next.js 14 app router
    - All data fetching should be done in a server component and pass the data down as props
    - Client components (useState, hooks, etc) require that 'use client' is set at the top of the files
    
2. Server-side API Calls:
    - All interactions with external APIs should be performed server-side to avoid exposing sensitive information.
    - Create dedicated API routes in the 'pages/api' directory for each external API interaction.
    - Client-side components should fetch data through these API routes, not directly from the external APIs.
    - Implement error handling for failed API calls.

3. Environment variables:
    - Use environment variables to store sensitive information such as API keys and tokens.
    - Store these in a '.env' file at the root of the project.
    - Use the 'dotenv' package to load these variables into the application.

4. Error handling and logging:
    - Implement a centralized error handling mechanism for both client and server components.
    - Use the 'next/error' component to display error messages to the user.
    - Log erros on the server-side for debugging purposes.
    - Display user-friendly error messages on the client-side.
    
5. Type safety:
    - Use TypeScript to its fullest extent to ensure type safety for all data.
    - Define types for API responses and use them to type the data in your application.
    - Avoid using 'any' type in your code. Define proper types for all variables and function parameters.

6. API Client Initialization:
    - Create a dedicated API client module for making API requests.
    - Initialize the API client with the base URL and any necessary headers or authentication tokens.
    - Use the API client in your application to make API requests.
    - Implement error handling for failed API calls.
    - Implement checks to ensure that the API client is not used before it is initialized.

7. Code quality:
    - Write clean, readable code with clear variable names and comments where necessary.
    - Follow best practices for code organization, modularity, and reusability.
    - Use the 'eslint' package to lint your code and fix any issues.

8. Data Fetching in Components:
    - Data fetching should be done in a server component and pass the data down as props.
    - Client components should use the 'use' prefix for hooks and state variables.
    - Use React hooks like 'useState', 'useEffect', and 'useContext' sparingly for data fetching in client-side components.

9. Security:
    - Implement security best practices such as rate limiting, input validation, and secure session management.
    - Use the 'helmet' package to set security-related HTTP headers.

10. Next.js Configuration:
    - Use the 'next' package to configure your Next.js application.
    - Set the 'next' package to use the 'app' directory.
    - Use the 'env' package to store environment variables.