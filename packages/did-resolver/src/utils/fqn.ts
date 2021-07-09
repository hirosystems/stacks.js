import { Either, Left, Right } from 'monet'

type FQN = {
  name: string
  namespace: string
  subdomain?: string
}

export const encodeFQN = (nameParts: FQN) => {
  const { name, subdomain, namespace } = nameParts
  return `${subdomain ? subdomain + '.' : ''}${name}.${namespace}`
}

export const decodeFQN = (fqdn: string): Either<Error, FQN> => {
  const nameParts = fqdn.split('.')
  if (nameParts.length < 2) {
    return Left(new Error('Invalid FQN')) // TODO Error Code
  }

  if (nameParts.length === 3) {
    const [subdomain, name, namespace] = nameParts
    return Right({
      subdomain,
      name,
      namespace,
    })
  } else {
    const [name, namespace] = nameParts
    return Right({
      name,
      namespace,
    })
  }
}
