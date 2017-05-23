#!/usr/bin/env python
# -*- coding: utf-8 -*-

import base64, hmac, sha

private_key = 'YOUR_PRIVATE_KEY'
input = open("policy.txt", "rb")
policy = input.read()
policy_encoded = base64.b64encode(policy)
signature = base64.b64encode(hmac.new(private_key, policy_encoded, sha).digest())
print "Your policy base-64 encoded is %s" % (policy_encoded)
print "Your signature base-64 encoded is %s" % (signature)
