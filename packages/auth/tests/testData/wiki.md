# Wiki

#### Names

A blockchain ID = a name + a profile, registered on a blockchain.

Let's say you register the name 'alice' within the 'id' namespace, the default namespace for identities for people. In this case, your "fully qualified name" name would be expressed as `alice.id`.

#### Profiles

Profile schemas are taken from schema.org. The schema for a person record can be found at http://schema.org/Person. There are some fields that have yet to be included, like the "account", "key", "policy", "id", and "publicKey" fields. An updated schema definition will be published to a different location that superclasses the schema.org Person definition and adds these fields.

#### Profile Storage

Blockchain ID profiles are stored in two files: a token file and a zone file:

+ **token file** - contains signed tokens with profile data
+ **zone file** - describes where to find the token file

#### Lookups

An identity lookup is performed as follows:

1. lookup the name in Blockstack's name records and get back the data hash associated with the name
2. lookup the data hash in the Blockstack Atlas network and get back the zone file
3. scan the zone file for "zone origin" records and get the token file URL
4. issue a request to the token file URL and get back the token file
5. parse through the token file for tokens and verify that all the tokens have valid signatures and that they can be tied back to the public key associated with the user's name
6. grab all of the claims in the tokens and merge them into a single JSON object, which is the user's profile
