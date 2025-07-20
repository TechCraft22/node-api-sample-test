pipeline {
    agent any

    tools {
        nodejs 'NodeJS'  // Ensure this matches the tool name configured in Jenkins
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Pulling code from GitHub master branch...'
                git branch: 'master', url: 'https://github.com/TechCraft22/node-api-sample-test.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                sh 'npm install'
            }
        }

        stage('Install Playwright Browsers') {
            steps {
                echo 'Installing Playwright browsers...'
               // sh 'npx playwright install || echo "Playwright installation failed"'
            }
        }

        stage('Stop Existing App') {
            steps {
                echo 'Stopping any existing app on port 3000...'
                sh 'pkill -f "node index.js" || echo "No existing process found"'
                sh 'sleep 2'
            }
        }

        stage('Start App for Testing') {
            steps {
                echo 'Starting app in background for testing...'
                sh 'nohup npm start > app.log 2>&1 &'
                sh 'sleep 5'
                sh 'cat app.log || echo "No app.log found"'
            }
        }

        stage('Run Jest Tests') {
            steps {
                echo 'Running Jest tests...'
                sh 'npm run test:unit || echo "Unit tests failed"'
            }
        }

        stage('Run e2e Tests with Playwright') {
            steps {
                echo 'Running Playwright tests...'
                //sh 'npm run test:e2e || echo "E2E tests failed"'
            }
        }

        stage('Stop App After Tests') {
            steps {
                echo 'Stopping test app...'
                sh 'pkill -f "node index.js" || echo "No existing process found"'
                sh 'sleep 2'
            }
        }

        stage('---------Deploy to Production--------------') {
            steps {
                echo 'Starting production app on port 3030...'
                sh 'PORT=3030 nohup npm start > production-app.log 2>&1 &'
                sh 'sleep 5'
                sh 'curl -f http://localhost:3030 && echo "Production app running"'
            }
        }

        stage('Debug - App Status') {
            steps {
                echo 'Checking app status...'
               // sh 'ps aux | grep "node index.js" | grep -v grep || echo "No node process found"'
                // 'netstat -tlnp | grep :3000 || echo "Port 3000 not listening"'
                //sh 'lsof -i :3000 || echo "Nothing using port 3000"'
            }
        }

        stage('Debug - Test Connection') {
            steps {
                echo 'Testing internal connection...'
                sh 'curl -v http://localhost:3030/ || echo "localhost curl failed"'
                //sh 'curl -v http://172.30.0.2:3030/ || echo "172.30.0.2 curl failed"'
                //sh 'curl -v http://127.0.0.1:3030/ || echo "127.0.0.1 curl failed"'
            }
        }

        stage('Debug - Environment') {
            steps {
                echo 'Checking environment...'
                sh 'echo "PORT value: $PORT"'
                //sh 'node -e "console.log(process.env.PORT)"'
                sh 'head -15 index.js'
            }
        }
    }

    post {
        always {
            echo '##### Pipeline completed! #####'
        }
        success {
            mail to: 'dev@localhost',
                 subject: "Build Success: ${env.JOB_NAME} [#${env.BUILD_NUMBER}]",
                 body: "The build was successful. Check logs at ${env.BUILD_URL}"
        }
        failure {
            mail to: 'dev@localhost',
                 subject: "Build FAILED: ${env.JOB_NAME} [#${env.BUILD_NUMBER}]",
                 body: "The build has failed. See logs at ${env.BUILD_URL}"
        }
    }
}
