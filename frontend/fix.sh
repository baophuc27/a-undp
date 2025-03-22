#!/bin/bash

echo "🔧 React and TypeScript Dependency Fixer"
echo "========================================"
echo

# Step 1: Remove node_modules to start fresh
echo "📦 Removing node_modules..."
rm -rf node_modules
rm -rf package-lock.json
echo "✅ Removed existing dependencies"
echo

# Step 2: Install core React dependencies
echo "⚛️ Installing React 18..."
npm install --legacy-peer-deps react@18.2.0 react-dom@18.2.0
echo "✅ React 18 installed"
echo

# Step 3: Install compatible TypeScript and type definitions
echo "📝 Installing compatible TypeScript and type definitions..."
npm install --legacy-peer-deps typescript@4.9.5
npm install --legacy-peer-deps @types/react@18.0.28 @types/react-dom@18.0.11
echo "✅ TypeScript and type definitions installed"
echo

# Step 4: Install webpack and tools
echo "🔨 Installing webpack and build tools..."
npm install --legacy-peer-deps --save-dev webpack webpack-cli webpack-dev-server webpack-merge
npm install --legacy-peer-deps --save-dev html-webpack-plugin mini-css-extract-plugin copy-webpack-plugin dotenv-webpack
npm install --legacy-peer-deps --save-dev clean-webpack-plugin terser-webpack-plugin css-minimizer-webpack-plugin
npm install --legacy-peer-deps --save-dev style-loader css-loader postcss-loader autoprefixer sass sass-loader
npm install --legacy-peer-deps --save-dev ts-loader
echo "✅ Webpack and build tools installed"
echo

# Step 5: Install map dependencies
echo "🗺️ Installing map dependencies..."
npm install --legacy-peer-deps leaflet react-leaflet @types/leaflet
npm install --legacy-peer-deps @turf/turf
echo "✅ Map dependencies installed"
echo

# Step 6: Fix any remaining issues with npm
echo "🔄 Running npm audit fix..."
npm audit fix --force
echo "✅ Dependency fixing complete!"
echo

echo "🚀 Next steps:"
echo "1. Run 'npm start' to verify the app starts correctly"
echo "2. If you need testing, run 'npm install --legacy-peer-deps jest@29.5.0 ts-jest@29.1.0 @testing-library/react@14.0.0'"
echo "3. Make sure to rename 'leftlet-extensions.d.ts' to 'leaflet-extensions.d.ts' if you haven't already"