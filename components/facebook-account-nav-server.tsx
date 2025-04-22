import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { getUserDetail } from '@/app/actions'
import { getFacebookBusinessAccounts, getFacebookAdAccounts } from '@/app/facebook-actions'
import { updateFbBusinessAcc, updateFbAccountId, updateFbPageId } from '@/app/actions'
import FacebookAccountNav from './facebook-account-nav'

export async function FacebookAccountNavServer() {
  const session = (await auth()) as Session
  
  if (!session?.user) {
    return null
  }

  let userDetails
  
  const response = await getUserDetail()
  if (response.success) {
    userDetails = response.user
  } else {
    console.log(response.error)
    return null
  }

  return (
    <FacebookAccountNav
      userDetails={userDetails}
      getFacebookBusinessAccounts={getFacebookBusinessAccounts}
      getFacebookAdAccounts={getFacebookAdAccounts}
      updateFbBusinessAcc={updateFbBusinessAcc}
      updateFbAccountId={updateFbAccountId}
      updateFbPageId={updateFbPageId}
    />
  )
}