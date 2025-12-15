pipeline {
    agent any
    tools {
        nodejs 'nodejs' 
    }

    environment {
        IMAGE_NAME = 'Rental_platform'
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
                    echo '--- 2. Running Tests ---'
            }
        }

        stage('Build & Deploy Local') {
            steps {
                script {
                    echo '--- 3. Building Docker Image ---'
                    // SỬA: Dùng 'bat'
                    bat "docker build -t ${IMAGE_NAME}:latest ."

                    echo '--- 4. Deploying Container ---'
                    
                    // SỬA: Logic dừng container cũ trên Windows
                    // returnStatus: true giúp pipeline không bị lỗi đỏ nếu container chưa tồn tại
                    bat script: "docker stop ${IMAGE_NAME}", returnStatus: true
                    bat script: "docker rm ${IMAGE_NAME}", returnStatus: true

                    // SỬA: Lệnh Docker Run cho Windows
                    // Thay dấu \ bằng dấu ^ để xuống dòng
                    bat """
                        docker run -d ^
                        --name ${IMAGE_NAME} ^
                        --restart unless-stopped ^
                        -p ${APP_PORT}:${APP_PORT} ^
                        ${IMAGE_NAME}:latest
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
            echo "SUCCESS: Da deploy thanh cong tren Windows!"
        }
        failure {
            echo "FAILURE: Co loi xay ra."
        }
    }
}