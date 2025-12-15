pipeline {
    agent any

    // Khai báo công cụ NodeJS (đã cài trong Global Tool Configuration)
    tools {
        nodejs 'nodejs' // Sửa lại nếu tên bạn đặt khác
    }

    environment {
        // Tên của Image và Container
        IMAGE_NAME = 'rental-backend'
        // Cổng mà ứng dụng Node.js chạy
        APP_PORT   = '3000' 
    }

    stages {
        // Bước 1: Lấy code về
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        // Bước 2: Cài đặt và Test
        stage('Install & Test') {
            steps {
                script {
                    echo '--- 1. Installing Dependencies ---'
                    sh 'npm install'
                    
                    echo '--- 2. Running Tests ---'
                    // Nếu chưa có test thì comment dòng dưới lại
                    // sh 'npm test' 
                }
            }
        }

        // Bước 3: Build và Deploy (Gộp làm 1 vì chạy trên cùng máy)
        stage('Build & Deploy Local') {
            steps {
                script {
                    echo '--- 3. Building Docker Image ---'
                    // Build image mới từ code vừa checkout
                    // Dùng tag :latest cho đơn giản vì chạy tại chỗ
                    sh "docker build -t ${IMAGE_NAME}:latest ."

                    echo '--- 4. Deploying Container ---'
                    // Dừng container cũ (thêm || true để không lỗi nếu container chưa tồn tại)
                    sh "docker stop ${IMAGE_NAME} || true"
                    
                    // Xóa container cũ
                    sh "docker rm ${IMAGE_NAME} || true"

                    // Chạy container mới
                    // Thêm -d để chạy ngầm (detached)
                    // --restart unless-stopped: Tự khởi động lại nếu server reboot
                    sh """
                        docker run -d \
                        --name ${IMAGE_NAME} \
                        --restart unless-stopped \
                        -p ${APP_PORT}:${APP_PORT} \
                        ${IMAGE_NAME}:latest
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs() // Dọn dẹp workspace
        }
        success {
            echo "✅ Deploy thành công ngay trên máy chủ!"
        }
        failure {
            echo "❌ Có lỗi xảy ra. Vui lòng kiểm tra Console Output."
        }
    }
}