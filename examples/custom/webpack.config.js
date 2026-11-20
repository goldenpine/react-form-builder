
var path = require('path');

module.exports = {
  entry: './app.js',

  output: {
    path: path.resolve('.'),
    filename: 'bundle.js',
    library: 'ReactFormBuilder',
    libraryTarget: 'umd'
  },

  externals: {
    'bootstrap': 'bootstrap'
  },

  resolve: {
    extensions: ['.js', '.jsx', '.scss', '.css', '.json'],
    alias: {
      "jquery": path.join(__dirname, "./jquery-stub.js")
    }
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|mjs)$/,
        exclude: function(filePath) {
          const transpilePackages = [
            'date-fns',
            'tom-select',
            'react-international-phone',
            'react-signature-canvas'
          ];

          // Always transpile application source files
          if (!filePath.includes(
            path.sep + 'node_modules' + path.sep
          )) {
            return false;
          }

          // Transpile selected dependencies
          return !transpilePackages.some(
            packageName => filePath.includes(
              path.sep + packageName + path.sep
            )
          );
        },
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      ie: '11'
                    }
                  }
                ],
                '@babel/preset-react'
              ]
            }
          }
        ]
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      },      
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      }
    ]
  }
};
