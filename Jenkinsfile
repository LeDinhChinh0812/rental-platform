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
        // --- Giai đoạn 1: Checkout Code ---
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        // --- Giai đoạn 2: Install & Test ---
        stage('Install & Test') {
            steps {
                script {
                    echo '--- 1. Installing Dependencies ---'
                    bat 'npm install'
                    echo '--- 2. Running Tests (Skip if none) ---'
                }
            }
        }

        // --- Giai đoạn 3: Build & Deploy ---
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