var AWS = require("aws-sdk");
AWS.config.region = process.env.REGION;
var es = require('elasticsearch').Client({
    hosts: process.env.HTTPS_ES_ENDPOINT,
    connectionClass: require('http-aws-es')
});
var REGION = process.env.REGION;
//Bucket which stores your ES Snapshots
var S3BUCKET = process.env.S3BUCKET;
//A Snapshot Repository Name
var S3_SNAPSHOT_REPO = process.env.S3_SNAPSHOT_REPO;
//Delegates permissions to Amazon Elasticsearch Service. The trust relationship for the role must specify Amazon Elasticsearch Service in the Principal statement.
var ROLE_ARN = process.env.ROLE_ARN;
//delete_old_indices will delete all the indices except the one provided in INDEX_NOT_TO_BE_DELETED
var INDEX_NOT_TO_BE_DELETED = process.env.INDEX_NOT_TO_BE_DELETED;
var ACTION = process.env.ACTION;

exports.handler = function(event, context) {

    if (ACTION) {
        if (ACTION == "verify_connection" || ACTION == "create_es_repo" || ACTION == "create_es_snapshot" || ACTION == "get_es_snapshots" || ACTION == "delete_old_indices" || ACTION == "delete_old_snapshots" || ACTION == "help") {
            if (ACTION == "verify_connection") verify_connection();
            if (ACTION == "create_es_repo") create_es_repo();
            if (ACTION == "create_es_snapshot") create_es_snapshot();
            if (ACTION == "get_es_snapshots") get_es_snapshots();
            if (ACTION == "delete_old_indices") delete_old_indices();
            if (ACTION == "delete_old_snapshots") delete_old_snapshots();
            if (ACTION == "help") help();
        } else console.log("ERROR: Specify a correct action among: verify_connection, create_es_repo, create_es_snapshot, get_es_snapshots, delete_old_indices, delete_old_snapshots or help");
    } else {
        console.log("ERROR: Action is not specified in Environment Variables")
        console.log('Specify any one of the action mentioned below:');
        console.log('verify_connection');
        console.log('create_es_repo');
        console.log('create_es_snapshot');
        console.log('delete_old_indices');
        console.log('delete_old_snapshots');
        console.log('get_es_snapshots');
    }

    function help() {
        console.log('Usage of the Script:');
        console.log('Specify one of the action below:');
        console.log('verify_connection');
        console.log('create_es_repo');
        console.log('create_es_snapshot');
        console.log('delete_old_indices');
        console.log('delete_old_snapshots');
        console.log('get_es_snapshots');
    }

    function verify_connection() {
        es.ping({
            requestTimeout: 3000
        }, function(error) {
            if (error) {
                console.trace('elasticsearch cluster is down!');
            } else {
                console.log('Connected to Elasticsearch!');
            }
        });
    }

    function create_es_repo() {
        es.snapshot.createRepository({
            repository: S3_SNAPSHOT_REPO,
            body: {
                type: 's3',
                settings: {
                    bucket: S3BUCKET,
                    region: REGION,
                    role_arn: ROLE_ARN,
                },
            },
        }, function(error) {
            if (error) {
                console.trace('Unable to create ES Snapshot Repository!');
            } else {
                console.log('Successfuly Created Repo.');
            }
        });
    }

    function create_es_snapshot() {
        var dateTime = require('node-datetime');
        var dt = dateTime.create();
        var formattedDate = dt.format('Ymd-HMS');
        snapshotName = "snap-" + formattedDate
        var snapParams = {
            "repository": S3_SNAPSHOT_REPO,
            "snapshot": snapshotName
        };
        console.log(snapParams)
        es.snapshot.create(snapParams).then(function(data) {
            console.log(data);
            console.log("Snapshot Created!")
        });
    }

    function get_es_snapshots() {
        es.cat.snapshots({
            repository: S3_SNAPSHOT_REPO
        }).then(function(data) {
            console.log(data);
        });
    }

    function delete_old_indices() {
        for (var i = 14; i < 15; i++) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            year = d.getFullYear();
            month = d.getMonth() + 1;
            dt = d.getDate();

            if (dt < 10) {
                dt = '0' + dt;
            }
            if (month < 10) {
                month = '0' + month;
            }
            index = year + '.' + month + '.' + dt
            console.log("Deleting Indices of date: " + index);
            indexToBeDeleted = '*-' + index + ',-' + INDEX_NOT_TO_BE_DELETED
            es.indices.delete({
                index: indexToBeDeleted
            }).then(function(data) {
                console.log(data);
            });
        }
    }

function delete_old_snapshots() {
    for (var i = 7; i < 8; i++) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        year = d.getFullYear();
        month = d.getMonth() + 1;
        dt = d.getDate();

        if (dt < 10) {
            dt = '0' + dt;
        }
        if (month < 10) {
            month = '0' + month;
        }
        snapshot = "snap-" + year + month + dt + "*"
        es.snapshot.get({
            repository: S3_SNAPSHOT_REPO,
            snapshot: snapshot
        }).then(function(data) {
            for (var k = 0; k < data.snapshots.length; k++) {
                snapshotName = data.snapshots[k].snapshot
                console.log("Deleting snapshot:", snapshotName)
                es.snapshot.delete({
                    repository: S3_SNAPSHOT_REPO,
                    snapshot: snapshotName
                }).then(function(data) {
                    console.log(data);
                });
            }
        });

    }
}
}
