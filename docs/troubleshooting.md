---
title: Troubleshooting
---

## Common Pitfall: regenerator-runtime

If using @stacks/connect with vite, rollup, svelte, or vue, a package `regenerator-runtime` needs to be manually added to build the project successfully.

`npm install --save-dev regenerator-runtime.`


```jsx live
function Clock(props) {
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    const timerID = setInterval(() => tick(), 1000);

    return function cleanup() {
      clearInterval(timerID);
    };
  });

  function tick() {
    setDate(new Date());
  }

  return (
    <div>
      <h2>It is {date.toLocaleTimeString()}.</h2>
    </div>
  );
}
```
