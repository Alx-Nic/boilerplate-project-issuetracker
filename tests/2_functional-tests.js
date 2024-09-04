const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  let testId;

  test("All fields present", function (done) {
    chai
      .request(server)
      .post("/api/issues/apitest")
      .send({
        issue_title: "My Test Title",
        issue_text: "My Test Text",
        created_by: "All fields present",
        assigned_to: "Nobody",
        status_text: "Active",
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, "My Test Title");
        assert.equal(res.body.issue_text, "My Test Text");
        assert.equal(res.body.created_by, "All fields present");
        assert.equal(res.body.assigned_to, "Nobody");
        assert.equal(res.body.status_text, "Active");
        assert.equal(res.body.open, true);
        assert.property(res.body, "created_on");
        assert.property(res.body, "updated_on");
        assert.property(res.body, "_id");

        testId = res.body._id;
        done();
      });
  });

  test("Only Required Fields", function (done) {
    chai
      .request(server)
      .post("/api/issues/test")
      .send({
        issue_title: "My Title",
        issue_text: "My Text",
        created_by: "Only Required Fields",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, "My Title");
        assert.equal(res.body.issue_text, "My Text");
        assert.equal(res.body.created_by, "Only Required Fields");
        assert.equal(res.body.assigned_to, "");
        assert.equal(res.body.status_text, "");
        assert.equal(res.body.open, true);
        assert.property(res.body, "created_on");
        assert.property(res.body, "updated_on");
        assert.property(res.body, "_id");

        done();
      });
  });

  test("Missing Required Fields", function (done) {
    chai
      .request(server)
      .post("/api/issues/test")
      .send({
        issue_title: "Title",
      })
      .end(function (err, res) {
        assert.equal(res.body.error, "required field(s) missing");
        done();
      });
  });

  test("View issues on a project", function (done) {
    chai
      .request(server)
      .get("/api/issues/test")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.property(res.body[0], "issue_title");
        assert.property(res.body[0], "issue_text");
        assert.property(res.body[0], "created_on");
        done();
      });
  });

  test("View issues on a project with one filter", function (done) {
    chai
      .request(server)
      .get("/api/issues/test?open=true")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        done();
      });
  });

  test("View issues on a project with multiple filters", async function () {
    const data = {
      issue_title: "Title",
      issue_text: "Text",
      created_by: "Created",
      assigned_to: "Nobody",
      status_text: "Active",
      open: true,
    };
    const date = Date.now().toString().substring(7);
    const url = `/api/issues/test-${date}?open=true&assigned_to=Nobody`;

    await chai.request(server).post(url).send(data);
    await chai.request(server).post(url).send(data);
    await chai.request(server).post(url).send(data);

    const res = await chai.request(server).get(url);

    assert.isArray(res.body);
    assert.equal(res.body.length, 3);
    assert.equal(res.body[0].issue_title, "Title");
    assert.equal(res.body[0].issue_text, "Text");
    assert.equal(res.body[0].created_by, "Created");
    assert.equal(res.body[0].assigned_to, "Nobody");
    assert.equal(res.body[0].status_text, "Active");
    assert.equal(res.body[0].open, true);
  });

  test("Update an issue", function (done) {
    chai
      .request(server)
      .put("/api/issues/test")
      .send({
        _id: testId,
        status_text: "Updated",
      })
      .end(function (err, res) {
        assert.equal(res.body.result, "successfully updated");
        done();
      });
  });

  test("Update No body", function (done) {
    chai
      .request(server)
      .put("/api/issues/test")
      .send({
        _id: testId,
      })
      .end(function (err, res) {
        assert.equal(res.body.error, "no update field(s) sent");
        done();
      });
  });

  test("Multiple Fields To Update", function (done) {
    chai
      .request(server)
      .put("/api/issues/test")
      .send({
        _id: testId,
        status_text: "updated again",
        assigned_to: "Someone else",
      })
      .end(function (err, res) {
        assert.equal(res.body.result, "successfully updated");
        done();
      });
  });

  test("Update With Missing Id", function (done) {
    chai
      .request(server)
      .put("/api/issues/test")
      .send({
        status_text: "updated again",
      })
      .end(function (err, res) {
        assert.equal(res.body.error, "missing _id");
        done();
      });
  });

  test("Update an issue with an Invalid ID", function (done) {
    chai
      .request(server)
      .put("/api/issues/test")
      .send({
        _id: "invalid",
        status_text: "updated again",
      })
      .end(function (err, res) {
        assert.equal(res.body.error, "could not update");
        done();
      });
  });

  test("Delete An Issue", function (done) {
    chai
      .request(server)
      .delete("/api/issues/test")
      .send({ _id: testId })
      .end((err, res) => {
        assert.equal(res.body.result, "successfully deleted");
        assert.equal(res.body._id, testId);
        done();
      });
  });

  test("Delete An Issue With An Invalid _id", function (done) {
    const badIdDelete = {
      _id: "5f665eb46e296f6b9b6a504d",
      issue_text: "New Issue Text",
    };
    chai
      .request(server)
      .delete("/api/issues/test")
      .send(badIdDelete)
      .end((err, res) => {
        assert.deepEqual(res.body, {
          error: "could not delete",
          _id: "5f665eb46e296f6b9b6a504d",
        });
        done();
      });
  });

  test("Delete An Issue With Missing _id", function (done) {
    chai
      .request(server)
      .delete("/api/issues/test-project")
      .send({})
      .end((err, res) => {
        assert.equal(res.body.error, "missing _id");
        done();
      });
  });
});
