import { prisma } from "$lib/database/client"
import { Shopify } from "sveltekit-shopify-api"
import { Session } from "sveltekit-shopify-api/dist/auth/session/index.js"

async function storeCallback (session: Session) {
  const {
    shop,
    id,
    state,
    isOnline,
    scope,
    expires: defaultExpires,
    accessToken,
    onlineAccessInfo,
  } = session

  const type = isOnline ? "onlineSession" : "offlineSession"

  try {
    let shopData = await prisma.shop.findFirst({
      where: {
        name: shop,
      },
    })

    if (!shopData) {
      shopData = await prisma.shop.create({
        data: {
          name: shop,
        },
      })
    }

    if (!shopData) {
      throw new Error(`Unable to create / find shop: ${ shop }`)
    }

    let expires: Date | undefined = defaultExpires || new Date()

    if (type === "onlineSession") {
      const id_user = onlineAccessInfo?.associated_user?.id ?? 0
      let onlineSession = null
      if (id_user) {
        onlineSession = await prisma.onlineSession.findFirst({
          where: {
            id_user,
          },
        })
      }

      if (!onlineSession) {
        onlineSession = await prisma.onlineSession.findFirst({
          where: {
            id_shop: shopData.id,
          },
        })
      }

      const primary_id = id.startsWith(shop) ? id : (onlineSession?.primary_id ?? "")
      const secondary_id = !id.startsWith(shop) ? id : (onlineSession?.secondary_id ?? "")

      expires =
        expires >= (onlineSession?.expires || new Date())
          ? expires
          : onlineSession?.expires

      if (onlineSession) {
        await prisma.onlineSession.update({
          where: {
            id: onlineSession.id,
          },
          data : {
            id_shop         : shopData.id,
            primary_id,
            secondary_id,
            id_user,
            state,
            scope,
            accessToken,
            expires,
            onlineAccessInfo: JSON.stringify(onlineAccessInfo),
          },
        })
      } else {
        await prisma.onlineSession.create({
          data: {
            id_shop         : shopData.id,
            primary_id,
            secondary_id,
            id_user,
            state,
            scope,
            accessToken,
            expires,
            onlineAccessInfo: JSON.stringify(onlineAccessInfo),
          },
        })
      }
    }

    if (type === "offlineSession") {
      await prisma.offlineSession.upsert({
        where : {
          id,
        },
        create: {
          id,
          id_shop: shopData.id,
          state,
          scope,
          accessToken,
        },
        update: {
          id_shop: shopData.id,
          state,
          scope,
          accessToken,
        },
      })
    }

    return true
  } catch (error) {
    console.error(error)
    return false
  }

  return true
}

async function loadCallback (id: string) {
  const type = id.startsWith("offline_") ? "offlineSession" : "onlineSession"

  if (type === "onlineSession") {
    // delete expired sessions
    await prisma.onlineSession.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    })

    const onlineSession = await prisma.onlineSession.findFirst({
      where  : {
        OR: [
          {
            primary_id: id,
          },
          {
            secondary_id: id,
          },
        ],
      },
      include: {
        shop: true,
      },
    })

    if (onlineSession) {
      const session = new Session(id, onlineSession.shop.name, onlineSession.state, true)
      session.accessToken = onlineSession.accessToken
      session.expires = onlineSession.expires
      session.scope = onlineSession.scope
      session.onlineAccessInfo = JSON.parse(onlineSession.onlineAccessInfo?.toString() ?? "{}")
      return session
    }
  }

  if (type === "offlineSession") {
    const offlineSession = await prisma.offlineSession.findUnique({
      where  : { id },
      include: {
        shop: true,
      },
    })

    if (offlineSession) {
      const session = new Session(id, offlineSession.shop.name, offlineSession.state, false)
      session.accessToken = offlineSession.accessToken
      session.scope = offlineSession.scope
      return session
    }
  }
  return undefined
}

async function deleteCallback (id: string) {
  try {
    await prisma.onlineSession.delete({
      where: { id },
    })
    await prisma.offlineSession.delete({
      where: { id },
    })
  } catch (e) {
    return true
  }
  return true
}

export const sessionStorage = new Shopify.Session.CustomSessionStorage(
  storeCallback,
  loadCallback,
  deleteCallback,
)
