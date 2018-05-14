# serverless-aws-elasticsearch-lambda-script
This Repo is about backing up the AWS Elasticsearch Cluster. The script will be helpful in:
* Creating Snapshots by backing up whole cluster
* Deleting 7 days old Snapshots 
* Deleting 14 days old indices

The script can be uploaded in AWS Lambda and triggered by Cloudwatch events.
* Clone the Repo
* Execute: npm install elasticsearch aws-sdk http-aws-es node-datetime
* Zip the directory. Ensure index.js and node_modules folder exist in the zip file.
* Upload the Zip file to AWS Lambda.
* Schedule trigger through Cloudwatch Events.
