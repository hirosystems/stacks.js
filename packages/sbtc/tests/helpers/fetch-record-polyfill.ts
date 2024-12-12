// import * as fs from 'fs';

// // Overriding fetch
// global.fetch = async (...args) => {
//   try {
//     // Perform the actual fetch
//     const response = await fetch(...args);

//     // Extract the information you need from the response
//     const responseData = await response.clone().text();

//     if (typeof args[0] === 'string') {
//       const url = new URL(args[0]);
//       const path = `${args[0].hostname}${args[0].pathname}`;
//       const log = `"${path}": ${responseData}`;
//     } else {
//       const log = `"${args[0]}": ${responseData}`;
//     }
//     const path = args[0];

//     const log = `"${args[0]}": ""`;
//     fs.appendFileSync('./network.log', JSON.stringify(log));

//     // Return the response as if nothing happened
//     return response;
//   } catch (error) {
//     console.error('Fetch error: ', error);
//     throw error;
//   }
// };
