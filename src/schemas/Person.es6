class Person {
  constructor(profile = {}, context = 'http://schema.org/') {
    this.profile = Object.assign({}, {
      '@context': context,
      '@type': 'Person'
    }, profile)
  }
}

export default Person