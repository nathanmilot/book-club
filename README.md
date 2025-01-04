### Auto populates events in the data/events.json file, i.e.

```json
{
  "events": [
    {
      "details": {
        "date": "2025-01-01T10:00",
        "title": "Title",
        "location": "<a href='https://maps.app.goo.gl/' target='_blank'>Location</a>"
      },
      "description": "text",
      "menu": ["a", "b", "c"]
    }
  ]
}
```

`location`, `description`, and `menu` aren't required fields, and have default values populated.
