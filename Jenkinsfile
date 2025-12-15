pipeline {
    agent any
    tools {
        nodejs 'nodejs'
    }

    environment {
        IMAGE_NAME = 'rental_platform'
        APP_PORT   = '3000'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                script {
                    echo '--- 1. Installing Dependencies ---'
                    bat 'npm install'
                    echo '--- 2. Running Tests (Skip if none) ---'
                }
            }
        }

        stage('Build & Deploy Local') {
            steps {
                script {
                    def branchName = env.GIT_BRANCH.replace('origin/', '').replace('/', '-')
                
                    echo "--- Building for branch: ${branchName} ---"
                    bat "docker build -t ${IMAGE_NAME}:${branchName} ."

                    // Deploy
                    bat script: "docker stop ${IMAGE_NAME}", returnStatus: true
                    bat script: "docker rm ${IMAGE_NAME}", returnStatus: true
                
                    bat """
                        docker run -d ^
                        --name ${IMAGE_NAME} ^
                        -p ${APP_PORT}:${APP_PORT} ^
                        ${IMAGE_NAME}:${branchName}
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs() 
        }
        success {
            echo "SUCCESS"
        }
        failure {
            echo "FAILURE!"
        }
    } // End Post
}