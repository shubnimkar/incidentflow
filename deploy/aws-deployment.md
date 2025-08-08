# 🚀 AWS Deployment Guide for IncidentFlow

## 📋 Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured
- Domain name (optional but recommended)

## 🏗️ Infrastructure Setup

### 1. **ECS (Elastic Container Service) Setup**

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name incidentflow-cluster

# Create task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service --cluster incidentflow-cluster --service-name incidentflow-service --task-definition incidentflow:1 --desired-count 2
```

### 2. **RDS (MongoDB Atlas Alternative)**
```bash
# Create RDS instance (if not using MongoDB Atlas)
aws rds create-db-instance \
  --db-instance-identifier incidentflow-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password your-password
```

### 3. **S3 Setup**
```bash
# Create S3 bucket for file uploads
aws s3 mb s3://incidentflow-uploads

# Configure CORS
aws s3api put-bucket-cors --bucket incidentflow-uploads --cors-configuration file://cors.json
```

### 4. **Application Load Balancer**
```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name incidentflow-alb \
  --subnets subnet-12345678 subnet-87654321 \
  --security-groups sg-12345678
```

### 5. **Route 53 (Domain)**
```bash
# Create hosted zone
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)

# Add A record
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 \
  --change-batch file://route53-changes.json
```

## 🔧 Environment Configuration

### **ECS Task Definition:**
```json
{
  "family": "incidentflow",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "your-ecr-repo/frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    },
    {
      "name": "auth-service",
      "image": "your-ecr-repo/auth-service:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ]
    }
  ]
}
```

### **Docker Images to ECR:**
```bash
# Build and push images
docker build -t incidentflow-frontend ./frontend/client
docker build -t incidentflow-auth ./services/auth
docker build -t incidentflow-incident ./services/incident
docker build -t incidentflow-user ./services/user
docker build -t incidentflow-oncall ./services/oncall

# Tag for ECR
docker tag incidentflow-frontend:latest your-account.dkr.ecr.region.amazonaws.com/incidentflow-frontend:latest
docker tag incidentflow-auth:latest your-account.dkr.ecr.region.amazonaws.com/incidentflow-auth:latest

# Push to ECR
aws ecr get-login-password --region region | docker login --username AWS --password-stdin your-account.dkr.ecr.region.amazonaws.com
docker push your-account.dkr.ecr.region.amazonaws.com/incidentflow-frontend:latest
docker push your-account.dkr.ecr.region.amazonaws.com/incidentflow-auth:latest
```

## 🔒 Security Setup

### **IAM Roles:**
```bash
# Create ECS execution role
aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

### **Security Groups:**
```bash
# Create security group for ALB
aws ec2 create-security-group \
  --group-name incidentflow-alb-sg \
  --description "Security group for IncidentFlow ALB"

# Create security group for ECS tasks
aws ec2 create-security-group \
  --group-name incidentflow-ecs-sg \
  --description "Security group for IncidentFlow ECS tasks"
```

## 📊 Monitoring

### **CloudWatch Setup:**
```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/incidentflow-frontend
aws logs create-log-group --log-group-name /ecs/incidentflow-auth
aws logs create-log-group --log-group-name /ecs/incidentflow-incident
aws logs create-log-group --log-group-name /ecs/incidentflow-user
aws logs create-log-group --log-group-name /ecs/incidentflow-oncall
```

### **Alarms:**
```bash
# Create CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name incidentflow-cpu-alarm \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

## 🚀 Deployment Commands

### **Initial Deployment:**
```bash
# Deploy all services
make deploy-aws

# Or individual services
make deploy-frontend
make deploy-auth
make deploy-incident
make deploy-user
make deploy-oncall
```

### **Update Deployment:**
```bash
# Update service
aws ecs update-service --cluster incidentflow-cluster --service incidentflow-service --force-new-deployment
```

## 🔍 Health Checks

### **Application Load Balancer Health Check:**
```bash
# Configure health check
aws elbv2 modify-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:region:account:targetgroup/incidentflow-tg/1234567890123456 \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3
```

## 📈 Scaling

### **Auto Scaling:**
```bash
# Create auto scaling group
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/incidentflow-cluster/incidentflow-service \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/incidentflow-cluster/incidentflow-service \
  --policy-name incidentflow-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## 🔧 SSL Certificate

### **ACM Certificate:**
```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names *.yourdomain.com \
  --validation-method DNS
```

## 📝 Environment Variables

### **ECS Environment Variables:**
```bash
# Update task definition with environment variables
aws ecs register-task-definition \
  --cli-input-json file://task-definition-with-env.json
```

### **Secrets Management:**
```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name incidentflow/jwt-secret \
  --secret-string "your-super-secure-jwt-secret"

aws secretsmanager create-secret \
  --name incidentflow/mongo-uri \
  --secret-string "mongodb+srv://username:password@cluster.mongodb.net/incidentflow"
```

## 🎯 Final Steps

1. **Update DNS**: Point your domain to the ALB
2. **Test**: Verify all services are healthy
3. **Monitor**: Set up CloudWatch dashboards
4. **Backup**: Configure automated backups
5. **Security**: Enable AWS WAF and Shield

## 📊 Cost Optimization

- Use Spot instances for non-critical workloads
- Enable auto-scaling based on demand
- Use S3 lifecycle policies for cost management
- Monitor and optimize resource usage 