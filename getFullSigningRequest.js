'use strict';

import aws from 'aws-sdk';
import crypto from 'crypto';
import moment from 'moment';

// temporary srubin creds
aws.config = {
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KET'
};

module.exports = function(filename) {
  return new Promise((resolve, reject) => {

    if(!filename) {
      return reject('Must specify a filename.');
    }

    assumeRole()
      .then((creds) => {
        aws.config = {
          accessKeyId: creds.AccessKeyId,
          secretAccessKey: creds.SecretAccessKey,
          sessionToken: creds.SessionToken
        };

        let signedUrl = signUrl(filename);
        if(!signedUrl) {
          res.status(500).json('Cannot sign url.');
        }

        let resp = getDefaultFields();
        resp.url = signedUrl;
        resp.fields.key = filename;
        resp.fields.AWSAccessKeyId = creds.AccessKeyId;
        Object.assign(resp.fields, getEncodedPolicyAndSignature(creds.SecretAccessKey));

        return resolve(resp);
      })
      .catch((err) => {
        return reject('Could not generate signed url request. Error: ' + err);
      });
  });
};


/**
 * @name assumeRole
 * @description Uses the current AWS credentials to assume the role of an S3 upload user.
 * @returns {Promise}
 */
function assumeRole() {
  let sts = new aws.STS({apiVersion: '2011-06-15'});

  return new Promise((resolve, reject) => {
    sts.assumeRole({
      RoleArn: 'arn:aws:iam::XXXXXXX:role/role-name',
      RoleSessionName: 'session-name',
      DurationSeconds: 60 * 20,
    }, (err, data) => {
      if(err) {
        return reject(err);
      }
      return resolve(data.Credentials);
    });
  });
}


/**
 * @name signUrl
 * @description Uses the AWS SDK to sign a URL for an S3 'PUT' request.
 * @param {String} - filename
 * @returns {String} - signed url
 */
function signUrl(filename) {
  let s3 = new aws.S3();
  let params = {Bucket: 'YOUR_BUCKET_NAME', Key: filename};
  return s3.getSignedUrl('putObject', params);
}


/**
 * @name getDefaultFields
 * @description Gets the default fields for the S3 upload request
 * @returns {Object} - fields
 */
function getDefaultFields() {
  return {
    fields: {
      'acl': 'private',
      'Content-Type': 'application/pdf',
      'success_action_status': 201
    }
  };
}


/**
 * @name getPolicy
 * @description Gets the policy to use for upload to the S3 bucket with a short expiration.
 * @returns {Object} - policy
 */
function getPolicy() {
  let expiration = moment().add(5, 'm').toDate();
  return {
    'expiration': expiration,
    'conditions': [
      {'bucket': 'YOUR_S#_BUCKET'},
      ['starts-with', '$key', ''],
      {'acl': 'private'},
      {'success_action_status': '201'},
      ['starts-with', '$Content-Type', 'application/pdf'],
      ['starts-with', '$filename', ''],
      ['content-length-range', 0, 524288000]
    ]
  };
}


/**
 * @name getEncodedPolicyAndSignature
 * @description Base64 encodes the policy and signs and encodes that encoded policy with a signature.
 * @param {String} - secret
 * @returns {Object} - the base64 policy and signature
 */
function getEncodedPolicyAndSignature(secret) {
  let stringPolicy = JSON.stringify(getPolicy());
  let base64Policy = new Buffer(stringPolicy, 'utf-8').toString('base64');
  let signature = crypto.createHmac('sha1', secret).update(new Buffer(base64Policy, 'utf-8')).digest('base64');
  return {
    policy: base64Policy,
    signature: signature
  };
}
