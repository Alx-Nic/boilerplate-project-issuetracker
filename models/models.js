const mongoose = require("mongoose");
const IssueSchema = new mongoose.Schema({
  project: { type: String, required: true, select: false },
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_by: { type: String, required: true },
  assigned_to: { type: String, default: "" },
  status_text: { type: String, default: "" },
  open: { type: Boolean, default: true },
  created_on: String,
  updated_on: String,
});

const Issue = mongoose.model("Issue", IssueSchema);

module.exports = { Issue, IssueSchema };
