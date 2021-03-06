import { Groups, insertSchema } from '/imports/api/groups';
import { JsonRoutes } from 'meteor/simple:json-routes';

JsonRoutes.add("get", "/api/groups", function (req, res, next) {
    const groups = Groups.find({}).fetch();
    JsonRoutes.sendResult(res, {
        data: groups
    });
});

/**
 * Needs a post body of
 * {
 *     name: "",
 *     startDate: "",
 *     endDate: "",
 *     creator: <user_id>,
 *     server: <server_id>
 * }
 */
JsonRoutes.add("post", "/api/groups/add", function(req, res, next) {
    try {
        insertSchema.validateSync(req.body);
        Groups.insert({
            ...req.body,
            participants: [
                req.body.creator
            ]
        }, (err, result) => {
            if(err) {
                JsonRoutes.sendResult(res, {
                    data: {
                        error: err.message
                    }
                });
            } else {
                const group = Groups.findOne({ _id: result });
                JsonRoutes.sendResult(res, {
                    data: group
                });
            }
        });
    } catch(e) {
        JsonRoutes.sendResult(res, {
            data: {
                error: e.message
            }
        })
    }
});

/**
 * Join a secret santa
 * {
 *     user: <id>,
 *     server: <id>
 * }
 */
JsonRoutes.add("post", "/api/groups/join", function(req, res, next) {
    const group = Groups.findOne({ server: req.body.server });
    if(!group) {
        JsonRoutes.sendResult(res, {
            data: {
                error: "No secret santa for that server"
            }
        })
    } else if (group.participants.includes(req.body.user)) {
        JsonRoutes.sendResult(res, {
            data: {
                error: "Already participating"
            }
        })
    } else {
        Groups.update({
            _id: group._id
        }, {
            $push: {
                participants: req.body.user
            }
        });
        JsonRoutes.sendResult(res, {
            data: Groups.findOne({ _id: group._id })
        });
    }
});

/**
 * Leave a secret santa
 * {
 *     user: <id>,
 *     server: <id>
 * }
 */
JsonRoutes.add("post", "/api/groups/leave", function(req, res, next) {
    const group = Groups.findOne({ server: req.body.server });
    if(!group) {
        JsonRoutes.sendResult(res, {
            data: {
                error: "No secret santa for that server"
            }
        })
    } else if (group.participants.includes(req.body.user)) {
        Groups.update({
            _id: group._id
        }, {
            $pull: {
                participants: req.body.user
            }
        });
        JsonRoutes.sendResult(res, {
            data: Groups.findOne({ _id: group._id })
        });
    } else {
        JsonRoutes.sendResult(res, {
            data: {
                error: "Not participating"
            }
        })
    }
});

/**
 * List participants
 */
JsonRoutes.add("get", "/api/groups/:id", function(req, res, next) {
    const group = Groups.findOne({ server: req.params.id });
    if(group) {
        JsonRoutes.sendResult(res, {
            data: group.participants
        });
    } else {
        JsonRoutes.sendResult(res, {
            data: {
                error: "No secret santa for that server"
            }
        })
    }

});

/**
 * End event
 */
JsonRoutes.add("post", "/api/groups/end", function(req, res, next) {
    const group = Groups.findOne({ server: req.body.server, creator: req.body.user });
    if(group) {
        Groups.remove({ server: req.body.server, creator: req.body.user });
        JsonRoutes.sendResult(res, {
            data: {
                response: "Success"
            }
        });
    } else {
        JsonRoutes.sendResult(res, {
            data: {
                error: "No secret santa for that server"
            }
        })
    }
});
