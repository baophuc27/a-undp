npm install --legacy-peer-deps react react-dom leaflet react-leaflet @types/leaflet @windy/plugin-api @turf/turf

# Install TypeScript and type definitions
npm install --legacy-peer-deps typescript @types/react @types/react-dom @types/node

# Install Webpack and related plugins
npm install --legacy-peer-deps --save-dev webpack webpack-cli webpack-dev-server webpack-merge
npm install --legacy-peer-deps --save-dev html-webpack-plugin mini-css-extract-plugin copy-webpack-plugin dotenv-webpack
npm install --legacy-peer-deps --save-dev clean-webpack-plugin terser-webpack-plugin css-minimizer-webpack-plugin
npm install --legacy-peer-deps --save-dev style-loader css-loader postcss-loader autoprefixer sass sass-loader
npm install --legacy-peer-deps --save-dev ts-loader file-loader url-loader

# Install Jest and testing tools
npm install --legacy-peer-deps jest ts-jest @types/jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom

# Install ESLint and Prettier
npm install --legacy-peer-deps eslint eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --legacy-peer-deps prettier eslint-config-prettier eslint-plugin-prettier
