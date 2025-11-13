async function analyzeProfile() {
  const username = document.getElementById("username").value;
  const result = document.getElementById("result");
  result.innerHTML = "Loading...";

  try {
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    const userData = await userRes.json();

    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
    const reposData = await reposRes.json();

    const orgsRes = await fetch(`https://api.github.com/users/${username}/orgs`);
    const orgsData = await orgsRes.json();

    const name = userData.name || "N/A";
    const login = userData.login;
    const location = userData.location || "N/A";
    const bio = userData.bio || "N/A";
    const company = userData.company || "N/A";
    const blog = userData.blog || "N/A";
    const email = userData.email || "N/A";
    const twitter = userData.twitter_username || "N/A";
    const followers = userData.followers;
    const following = userData.following;
    const gists = userData.public_gists;
    const repoCount = userData.public_repos;
    const created = new Date(userData.created_at).toLocaleDateString();
    const updated = new Date(userData.updated_at).toLocaleDateString();
    const avatar = userData.avatar_url;
    const profileUrl = userData.html_url;

    let languageBytes = {};
    let commitEstimate = 0;

    for (const repo of reposData) {
      const langRes = await fetch(repo.languages_url);
      const langData = await langRes.json();
      for (const [lang, bytes] of Object.entries(langData)) {
        languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
      }
      commitEstimate += repo.size;
    }

    const totalBytes = Object.values(languageBytes).reduce((a, b) => a + b, 0);
    const langPercentages = Object.entries(languageBytes)
      .map(([lang, bytes]) => {
        const percent = ((bytes / totalBytes) * 100).toFixed(1);
        return `${lang} ${percent}%`;
      })
      .join(" · ");

    result.innerHTML = `
      <img src="${avatar}" width="100" style="border-radius:50%;margin-bottom:10px;" />
      <h2>${name} (${login})</h2>
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Blog:</strong> <a href="${blog}" target="_blank">${blog}</a></p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Twitter:</strong> ${twitter}</p>
      <p><strong>Description:</strong> ${bio}</p>
      <p><strong>Followers:</strong> ${followers} | <strong>Following:</strong> ${following}</p>
      <p><strong>Public Gists:</strong> ${gists}</p>
      <p><strong>Public Repositories:</strong> ${repoCount}</p>
      <p><strong>Estimated Commits:</strong> ${commitEstimate}</p>
      <p><strong>Languages Used:</strong> ${langPercentages}</p>
      <p><strong>Organizations:</strong> ${orgsData.map(o => o.login).join(", ") || "None"}</p>
      <p><strong>Profile Created:</strong> ${created}</p>
      <p><strong>Last Updated:</strong> ${updated}</p>
      <p><strong>Profile Link:</strong> <a href="${profileUrl}" target="_blank">${profileUrl}</a></p>
    `;

    renderChart(languageBytes);
  } catch (error) {
    result.innerHTML = "Error fetching data. Please check the username.";
  }
}

function renderChart(languageBytes) {
  const ctx = document.getElementById("languageChart").getContext("2d");
  const labels = Object.keys(languageBytes);
  const data = Object.values(languageBytes);
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        label: "Languages",
        data: data,
        backgroundColor: [
          "#238636", "#1f6feb", "#e3b341", "#d73a49", "#6f42c1", "#0a3069"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}
