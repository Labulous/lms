import ejs from "ejs";

export const generateHTML = async (data:any) => {
  // Fetch the EJS template
  const response = await fetch("/templates/invoice.ejs"); // Adjust the path based on your setup
  const template = await response.text();

  // Render the template with data
  return ejs.render(template, data);
};
