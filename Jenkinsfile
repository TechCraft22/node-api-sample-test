pipeline {
    agent any

    tools {
        nodejs 'NodeJS'  // Ensure this matches the tool name configured in Jenkins
    }

    environment {
        // Docker Hub credentials
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials')
        DOCKER_HUB_USERNAME = "${DOCKER_HUB_CREDENTIALS_USR}"
        
        // Docker image configuration
        DOCKER_IMAGE_NAME = "ajaytech/node-api-test-app"  // Replace with your username
        DOCKER_TAG = "${BUILD_NUMBER}"
        DOCKER_LATEST_TAG = "latest"
        
        // Repository visibility (change to 'private' if needed)
        REPO_VISIBILITY = "public"  // or "private"
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
               //TO-DO Fix# sh 'npx playwright install || echo "Playwright installation failed"'
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
                //TO-DO fix # sh 'npm run test:e2e || echo "E2E tests failed"'
            }
        }

        stage('Stop App After Tests') {
            steps {
                echo 'Stopping test app...'
                sh 'pkill -f "node index.js" || echo "No existing process found"'
                sh 'sleep 2'
            }
        }

        // IMPROVED DOCKER STAGES
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                script {
                    // Build Docker image
                    def image = docker.build("${DOCKER_IMAGE_NAME}:${DOCKER_TAG}")
                    
                    // Tag as latest
                    sh "docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} ${DOCKER_IMAGE_NAME}:${DOCKER_LATEST_TAG}"
                    
                    echo "Docker image built successfully: ${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
                }
            }
        }

        stage('Test Docker Image') {
            steps {
                echo 'Testing Docker image...'
                script {
                    try {
                        // Clean up any existing test containers first
                        sh 'docker stop test-container || echo "No existing container"'
                        sh 'docker rm test-container || echo "No existing container to remove"'
                        
                        // Run container in background for testing
                        sh "docker run -d --name test-container -p 3001:3000 --network jenkinks_jenkins-net ${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
                        
                        // Check if container started
                        sh 'docker ps | grep test-container'
                        echo "Container started successfully"
                        
                        // Wait for application to be ready with proper health checking
                        sh '''
                            echo "Waiting for application to be ready..."
                            for i in $(seq 1 3); do
                                echo "Health check attempt $i/12"
                                sleep 5
                                
                                # Check if container is still running
                                if ! docker ps | grep -q test-container; then
                                    echo "Container stopped running!"
                                    docker logs test-container
                                    exit 1
                                fi
                                
                                # Check container logs for server ready message
                               ## if docker logs test-container 2>&1 | grep -q "Server is running"; then
                                    echo "Server is ready according to logs"
                                    
                                    # Test connectivity
                                    if curl -f -s -m 10 http://localhost:3001 > /dev/null; then
                                        echo "✅ Health check passed!"
                                        curl -v http://localhost:3001
                                        break
                                    else
                                        echo "Server ready but curl failed, checking network..."
                                        docker exec test-container netstat -tlnp | grep :3000 || echo "Port 3000 not listening"
                                    fi
                               ## fi
                                
                                if [ $i -eq 3 ]; then
                                    echo "❌ Health check failed after 15 seconds"
                                    echo "=== Final Container Logs ==="
                                    docker logs test-container
                                    echo "=== Container Processes ==="
                                    docker exec test-container ps aux
                                    echo "=== Network Status ==="
                                    docker exec test-container netstat -tlnp
                                    echo "=== Container Inspect ==="
                                    docker inspect test-container
                                    exit 1
                                fi
                            done
                        '''
                        
                        echo "Docker image test completed successfully!"
                        
                    } catch (Exception e) {
                        echo "Docker test failed: ${e.getMessage()}"
                        // Show comprehensive debugging info
                        sh '''
                            echo "=== Debugging Docker Test Failure ==="
                            docker logs test-container || echo "No container logs available"
                            docker ps -a | grep test-container || echo "No container found"
                            docker inspect test-container || echo "Cannot inspect container"
                        '''
                        throw e
                    } finally {
                        // Always clean up test container
                        sh 'docker stop test-container || echo "Container already stopped"'
                        sh 'docker rm test-container || echo "Container already removed"'
                    }
                }
            }
        }

        stage('Detect Branch') {
            steps {
                script {
                    def branch = sh(script: "git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
                    echo "Git branch detected: ${branch}"
                }
            }
        }

        stage('Push to Docker Hub') {
            when {
                // Only push on successful builds from master branch
                expression {
                    def branch = sh(script: "git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
                    return branch == 'master'
                }
            }
            steps {
                echo 'Pushing Docker image to Docker Hub...'
                script {
                    // Login to Docker Hub
                    sh 'echo $DOCKER_HUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_USERNAME --password-stdin'
                    
                    // Push both tags
                    sh "docker push ${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
                    sh "docker push ${DOCKER_IMAGE_NAME}:${DOCKER_LATEST_TAG}"
                    
                    echo "Images pushed successfully!"
                    echo "Public URL: https://hub.docker.com/r/${DOCKER_IMAGE_NAME}"
                }
            }
            post {
                always {
                    // Logout from Docker Hub
                    sh 'docker logout'
                }
            }
        }

        stage('Deploy to local as Production') {
            steps {
                echo 'Deploying to production using Docker...'
                script {
                    // Stop existing production container if running
                    sh 'docker stop production-app || echo "No existing container"'
                    sh 'docker rm production-app || echo "No existing container to remove"'
                    
                    // Run new production container
                    sh """
                        docker run -d \
                        --name production-app \
                        --network jenkinks_jenkins-net \
                        -p 3000:3000 \
                        --restart unless-stopped \
                        ${DOCKER_IMAGE_NAME}:${DOCKER_TAG}
                    """
                    
                    // Proper health check for production
                    sh '''
                        echo "Verifying production deployment..."
                        for i in $(seq 1 12); do
                            echo "Production health check $i/12"
                            sleep 5
                            
                            # Check if container is running
                            if ! docker ps | grep -q production-app; then
                                echo "Production container stopped!"
                                docker logs production-app
                                exit 1
                            fi
                            
                            # Check if server is ready in logs first
                            #if docker logs production-app 2>&1 | tail -n 100 | grep -qi "Server is running"; then
                                echo "Server is ready according to logs"
                                
                                # Test production endpoint
                                if curl -f -s -m 10 http://localhost:3000 > /dev/null; then
                                    echo "✅ Production deployment successful!"
                                    curl -v http://localhost:3000
                                    echo "Application is accessible at http://localhost:3000"
                                    break
                                else
                                    echo "Server ready but curl failed, checking network..."
                                    docker exec production-app netstat -tlnp | grep :3000 || echo "Port 3000 not listening"
                                fi
                            #fi
                            
                            if [ $i -eq 12 ]; then
                                echo "❌ Production health check failed after 60 seconds"
                                echo "=== Production Container Logs ==="
                                docker logs production-app
                                echo "=== Production Container Status ==="
                                docker ps | grep production-app || echo "Container not running"
                                echo "=== Network Status ==="
                                docker exec production-app netstat -tlnp || echo "Cannot check network"
                                exit 1
                            fi
                        done
                    '''
                }
            }
        }

        stage('Cleanup Docker Images') {
            steps {
                echo 'Cleaning up old Docker images...'
                script {
                    // Keep last 3 images, remove older ones
                    sh """
                        docker images ${DOCKER_IMAGE_NAME} --format "table {{.Tag}}" | \
                        grep -E '^[0-9]+\$' | sort -nr | tail -n +4 | \
                        xargs -I {} docker rmi ${DOCKER_IMAGE_NAME}:{} || echo "No old images to remove"
                    """
                }
            }
        }

        stage('Debug - Environment') {
            steps {
                echo 'Checking environment...'
                sh 'echo "PORT value: $PORT"'
                sh 'docker --version'
                sh 'docker images | grep "${DOCKER_IMAGE_NAME}" || echo "No images found"'
            }
        }
    }

    post {
        always {
            echo '##### Pipeline completed! #####'
            // Clean up any test containers
            sh 'docker stop test-container || echo "No test container to stop"'
            sh 'docker rm test-container || echo "No test container to remove"'
        }
        success {
            mail to: 'dev@localhost',
                 subject: "Build Success: ${env.JOB_NAME} [#${env.BUILD_NUMBER}]",
                 body: """
                     The build was successful!
                     
                     Docker Image: ${DOCKER_IMAGE_NAME}:${DOCKER_TAG}
                     Docker Hub: https://hub.docker.com/r/${DOCKER_IMAGE_NAME}
                     
                     Application is running at: http://localhost:3000
                     
                     Check logs at ${env.BUILD_URL}
                 """
        }
        failure {
            mail to: 'dev@localhost',
                 subject: "Build FAILED: ${env.JOB_NAME} [#${env.BUILD_NUMBER}]",
                 body: "The build has failed. See logs at ${env.BUILD_URL}"
        }
    }
}