"use strict";

const { Issue } = require("../models/models");

module.exports = function (app) {
  app
    .route("/api/issues/:project")
    .get(async function (req, res) {
      try {
        const project = req.params.project;
        const query = req.query;

        const issues = await Issue.find({ project, ...query });
        res.json(issues);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    })

    .post(async function (req, res) {
      req.body.project = req.params.project;

      const issue = mapCreateToIssue(req);

      const validationError = issue.validateSync();

      if (validationError && validationError?.errors) {
        res.json({ error: "required field(s) missing" });
        return;
      }

      try {
        const savedIssue = await issue.save();
        res.json(savedIssue);
      } catch (error) {
        res.status(500).json(error);
      }
    })

    .put(async function (req, res) {
      const { _id, ...fieldsToUpdate } = req.body;

      if (!_id) {
        return res.json({ error: "missing _id" });
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.json({ error: "no update field(s) sent", _id });
      }
      const issue = mapUpdateToIssue(req);

      if (issue._id === undefined) {
        return res.json({ error: "could not update", _id });
      }
      try {
        const updatedIssue = await Issue.findOneAndUpdate(
          { _id: issue._id },
          issue,
          {
            new: true,
          }
        );

        if (!updatedIssue) {
          return res.json({ error: "could not update", _id });
        }
        res.json({
          result: "successfully updated",
          _id,
        });
      } catch (error) {
        res.status(500).json(error);
      }
    })

    .delete(async function (req, res) {
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: "missing _id" });
      }

      try {
        const deletedIssue = await Issue.findByIdAndDelete(_id);

        if (!deletedIssue) {
          return res.json({ error: "could not delete", _id });
        }

        return res.json({ result: "successfully deleted", _id: _id });
      } catch (error) {
        return res.json({ error: "could not delete", _id: _id });
      }
    });
};

function mapUpdateToIssue(req) {
  return new Issue({
    _id: req.body._id,
    project: req.body.project,
    issue_title: req.body.issue_title,
    issue_text: req.body.issue_text,
    created_by: req.body.created_by,
    assigned_to: req.body.assigned_to,
    status_text: req.body.status_text,
    open: req.body.open,
    updated_on: new Date().toISOString(),
    created_on: req.body.created_on,
  });
}

function mapCreateToIssue(req) {
  return new Issue({
    project: req.body.project,
    issue_title: req.body.issue_title,
    issue_text: req.body.issue_text,
    created_by: req.body.created_by,
    assigned_to: req.body.assigned_to,
    status_text: req.body.status_text,
    open: true,
    created_on: new Date().toISOString(),
    updated_on: new Date().toISOString(),
  });
}
