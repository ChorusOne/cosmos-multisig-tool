# Cosmoshub Multisig App

## Setup and Run

```bash
# Run dgraph standalone docker image
$ docker run --rm -it -p "8080:8080" -p "9080:9080" -p "8000:8000" -v ~/dgraph:/dgraph "dgraph/standalone:v21.03.2"

# Run migrations
$ curl -X POST localhost:8080/admin/schema --data-binary '@db-schema.graphql'

# Create .env.local file
$ cp .env.sample .env.local

# Install Node packages
# Node version: v18.20.3
$ npm i

# Start the web application
$ npm run  dev

# Vist http://localhost:3000 to access the multisig manager UI.
# Here you can create new multisigs and manage existing ones.
# This UI also allows you manually create multisig transactions.

# To automate transaction creation, we use the cosmosig CLI tool.

# Generate transactions programmatically by providing a CSV file
# containing the payout information. The CSV file must have columns
# as the superset of the columns present in payout.sample.csv.
$ ./cosmosig/cli/cosmosig.py payout new payout.sample.csv

# View the generated transactions
# Note the ID of the transaction which you'd like to start from
# the output of this command.
$ ./cosmosig/cli/cosmosig.py payout status

# Start a transaction
$ ./cosmosig/cli/cosmosig.py transaction start <tx-id>
# The output of this command will contain a link to the UI
# with the desired trasaction generated and ready to be signed
# by multiple parties.

# Note: at any given time, we can only have a single transaction in 
# progress. This means we cannot start manother transaction
# simultaneously without completing the already started transaction.
# This is done to avoid `sequenceNumber` conflicts between transactions.

# Once a transaction has been signed by all the required parties
# and ultimately broadcasted, we need to mark it as complete for
# the cosmosig tool. Note that we don't need to provide any ID, because
# there can be only be at most 1 transaction in progress.
$ ./cosmosig/cli/cosmosig.py transaction complete

# Repeat the `transaction start` and `transaction complete` steps for all
# the remaning transactions in the payout.
```

