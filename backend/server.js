const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: "eLearning-user",
    host: "localhost",
    database: "eLearning",
    password: "123",
    port: 5432,
});

app.get("/api/student_course", async (req, res) => {
    try {
      const result = await pool.query(`SELECT CONCAT(u.firstname, ' ' ,u.lastname) as username, classid, courseid, lessonid, SUM(timespent) as totaltime
          FROM public.mdl_lesson_time_tracking ltt
          JOIN public.mdl_user u
          ON ltt.userid = u.id
          GROUP BY u.firstname, u.lastname, classid, courseid, lessonid`);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

app.get("/api/course/:id", async (req, res) => {
  try {
    const courseId = req.params.id;
    const course_query = await pool.query(`SELECT id, fullname, shortname,timecreated, timemodified, timetocomplete FROM public.mdl_course
                                            WHERE id=$1;`, [courseId]);
    const lesson_query = await pool.query(`SELECT id, course, name, timemodified, lessontime
                                            FROM public.mdl_lesson
                                            WHERE course=$1;`, [courseId]);
    res.json({
      course: course_query.rows,
      lesson: lesson_query.rows
    })
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

app.patch("/api/course/:id/time-to-complete", async (req, res) => {
  const courseId = req.params.id;
  const { timetocomplete } = req.body; 
  
  if (timetocomplete === undefined) {
    return res.status(400).json({ error: "timetocomplete field is required." });
  }
  if(typeof(timetocomplete) !== 'number') {
    return res.status(400).json({ error: "timetocomplete must be a number." });
  }

  try {
    const updateQuery = `UPDATE public.mdl_course
                         SET timetocomplete = $1
                         WHERE id = $2;`;
    await pool.query(updateQuery, [timetocomplete, courseId]);

    res.status(200).json({ message: "Course timetocomplete updated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/course/:id/name", async (req, res) => {
  const courseId = req.params.id;
  const { name } = req.body;
  try {
    const updateQuery = `UPDATE public.mdl_course
                         SET fullname = $1, timemodified = EXTRACT(EPOCH FROM NOW())
                         WHERE id = $2;`;
    await pool.query(updateQuery, [name, courseId]);

    res.status(200).json({ message: "Course name updated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/lesson/:id/lesson-time", async (req, res) => {
  const lessonId = req.params.id;
  const { lessontime } = req.body;

  if (lessontime === undefined) {
    return res.status(400).json({ error: "lessontime field is required." });
  }
  if (typeof lessontime !== 'number') {
    return res.status(400).json({ error: "lessontime must be a number." });
  }

  try {
    const updateQuery = `UPDATE public.mdl_lesson
                         SET lessontime = $1, timemodified = EXTRACT(EPOCH FROM NOW())
                         WHERE id = $2;`;
    await pool.query(updateQuery, [lessontime, lessonId]);

    res.status(200).json({ message: "Lesson lessontime updated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/lesson/:id/name", async (req, res) => {
  const lessonId = req.params.id;
  const { name } = req.body;

  if (name === undefined) {
    return res.status(400).json({ error: "name field is required." });
  }
  if (typeof name !== 'string') {
    return res.status(400).json({ error: "name must be a string." });
  }

  try {
    const updateQuery = `UPDATE public.mdl_lesson
                         SET name = $1, timemodified = EXTRACT(EPOCH FROM NOW())
                         WHERE id = $2;`;
    await pool.query(updateQuery, [name, lessonId]);

    res.status(200).json({ message: "Lesson name updated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});