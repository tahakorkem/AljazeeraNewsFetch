import fetch from 'node-fetch'

// these are the constants that can be changed
const pageSize = 5
const pageCountForEachCategory = 3
const categories = [
  {type: "categories", name: "economy"},
  {type: "categories", name: "sports"},
  {type: "tags", name: "science-and-technology"},
  {type: "tags", name: "ukraine-russia-crisis"},
  {type: "tags", name: "coronavirus-pandemic"},
]
// end of constants
const url = "https://www.aljazeera.com/graphql?"

const fetchCategoryArticles = async (category, page) => {
  const params = new URLSearchParams([
    ['wp-site', 'aje'],
    ['operationName', 'ArchipelagoAjeSectionPostsQuery'],
    ['variables', JSON.stringify({
      category: category.name,
      categoryType: category.type,
      postTypes: ['blog', 'post'],
      quantity: pageSize,
      offset: (page - 1) * pageSize
    })],
    ['extensions', '{}']
  ])
  const response = await fetch(url + params, {
    headers: {
      "content-type": "application/json",
      "accept": "*/*",
      "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      "original-domain": "www.aljazeera.com",
      "wp-site": "aje",
      "Referer": `https://www.aljazeera.com/${category}/`,
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    method: "GET",
  })
  const json = await response.json()
  return json.data.articles
}

const fetchSingleArticle = async (slug) => {
  const params = new URLSearchParams([
    ['wp-site', 'aje'],
    ['operationName', 'ArchipelagoSingleArticleQuery'],
    ['variables', JSON.stringify({
      name: slug.split("/").pop(),
      postType: 'post',
      preview: ''
    })],
    ['extensions', '{}']
  ])

  const response = await fetch(url + params, {
    headers: {
      "content-type": "application/json",
      "accept": "*/*",
      "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      "original-domain": "www.aljazeera.com",
      "sec-ch-ua": "\"Google Chrome\";v=\"113\", \"Chromium\";v=\"113\", \"Not-A.Brand\";v=\"24\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "wp-site": "aje"
    },
    "referrer": `https://www.aljazeera.com/${slug}`,
    "referrerPolicy": "strict-origin-when-cross-origin",
    method: "GET",
    "mode": "cors",
    "credentials": "include"
  });
  const json = await response.json()
  return json.data.article
}

const fetchCategoryArticleDetails = async (category, pageCount) => {
  console.time(`time to fetch category ${category.name}`)

  const pageNumbers = Array.from({length: pageCount}, (_, i) => i + 1)

  const pageResults = await Promise.all(pageNumbers.map(async p => {
    const articles = await fetchCategoryArticles(category, p)
    return await Promise.all(articles.map(async a => {
      const {id, title, link, content, author} = await fetchSingleArticle(a.link)
      // here we can return the data we want
      // you can add more fields if you want
      return {
        id,
        title,
        link,
        // content,
        author: author[0]?.name,
        category: category.name
      }
    }))
  }))

  console.timeEnd(`time to fetch category ${category.name}`)
  return pageResults.flat()
}

const fetchAll = async () => {
  console.time("time to fetch all categories")
  const results = await Promise.all(categories.map(async category => {
    return await fetchCategoryArticleDetails(category, pageCountForEachCategory)
  }))
  console.timeEnd("time to fetch all categories")
  return results.flat()
}

fetchAll()
  .then((r) => console.log("Results", r))
  .catch(e => console.error(e))