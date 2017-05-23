/*
* Assume a role via AWS STS in order to upload as a role instead of as an individual
*/

var aws = require('aws-sdk');

// aws creds
aws.config = {
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY'
};

let sts = new aws.STS({apiVersion: '2011-06-15'});
sts.assumeRole({
  RoleArn: 'arn:aws:iam::XXXXXXXXXXX:role/role-name',
  RoleSessionName: 'testsession',
  DurationSeconds: 60 * 20,
}, (err, data)=>{
  if(err) {
    return err;
  }
  return data;
});
