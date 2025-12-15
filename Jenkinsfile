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
                    echo '--- 3. Building Docker Image ---'
                    bat "docker build -t ${IMAGE_NAME}:latest ."

                    echo '--- 4. Deploying Container ---'
                    // Stop và Remove container cũ (returnStatus: true để không lỗi nếu chưa có container)
                    bat script: "docker stop ${IMAGE_NAME}", returnStatus: true
                    bat script: "docker rm ${IMAGE_NAME}", returnStatus: true

                    // Chạy container mới (Dùng dấu ^ để xuống dòng trong CMD Windows)
                    // Lưu ý: Không được có khoảng trắng sau dấu ^
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

    // --- Xử lý sau khi chạy xong ---
    post {
        always {
            cleanWs() // Dọn dẹp workspace
        }
        success {
            echo "SUCCESS: Da deploy thanh cong tren Windows!"
        }
        failure {
            echo "FAILURE: Co loi xay ra."
        }
    } // End Post
}