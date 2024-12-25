export const DEPLOYMENT_NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deployment Not Found - NimbusWave</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background-color: #000;
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 0 20px;
            box-sizing: border-box;
        }
        .container {
            text-align: center;
            max-width: 600px;
        }
        h1 {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 16px;
        }
        p {
            font-size: 18px;
            line-height: 1.5;
            color: #888;
            margin-bottom: 24px;
        }
        .error-code {
            font-family: monospace;
            background-color: #111;
            color: #fff;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            display: inline-block;
            margin-bottom: 24px;
        }
        .button {
            background-color: #fff;
            color: #000;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 500;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #f0f0f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Deployment Not Found</h1>
        <p>We couldn't find the deployment you're looking for. It may have been deleted or never existed.</p>
        <div class="error-code">Error Code: DEPLOYMENT_NOT_FOUND</div>
        <a href="/" class="button">Return to NimbusWave</a>
    </div>
</body>
</html>`;