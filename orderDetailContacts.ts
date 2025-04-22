/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { type Request, type Response } from 'express'
import { type OrderDetailContact, OrderDetailContactScheme } from '../interfaces/IOrderDetailContact'
import {
  createOrderDetailContact,
  deleteOrderDetailContactById,
  findOrderDetailContactById,
  listOrderDetailContacts,
  updateOrderDetailContact
} from '../services/orderDetailContacts.service'
import { handleHttpError, handleValidationError } from '../utils/handleHTTPResponses'

export async function create (req: Request, res: Response): Promise<any> {
  try {
    console.log(req.body)
    const result = OrderDetailContactScheme.safeParse(req.body)
    console.log('result', result)
    if (!result.success) {
      return handleValidationError(res, result.error)
    } else {
      const data: OrderDetailContact = result.data
      const newOrderDetailContact = await createOrderDetailContact(data)
      return res.status(200).send({
        success: true,
        message: 'Success creating the Pod Contact.',
        data: newOrderDetailContact
      })
    }
  } catch (error) {
    handleHttpError(res, 'Error creating the Pod Contact ' + error)
  }
}

export async function list (_: Request, res: Response): Promise<any> {
  try {
    const orderDetailContactsList = await listOrderDetailContacts()
    return res.status(200).send({
      success: true,
      message: 'Success getting the Pod Contacts list',
      data: orderDetailContactsList
    })
  } catch (error: any) {
    console.log(error)
    handleHttpError(res, 'Error getting the Pod Contacts list ' + error)
  }
}

export async function findById (req: Request, res: Response): Promise<any> {
  try {
    const orderDetailContactFounded = await findOrderDetailContactById(req.params.id)
    if (!orderDetailContactFounded) {
      return res
        .status(404)
        .send({ success: false, message: 'Pod Contact not found.' })
    }
    return res.status(200).send({
      success: true,
      message: 'Success getting the Pod Contact.',
      data: orderDetailContactFounded
    })
  } catch (error) {
    handleHttpError(res, 'Error getting the Pod Contact ' + error)
  }
}

export async function update (req: Request, res: Response): Promise<any> {
  try {
    const { id } = req.body
    const result = OrderDetailContactScheme.safeParse(req.body)
    if (!result.success) {
      return handleValidationError(res, result.error)
    } else {
      const data: OrderDetailContact = result.data
      delete data.id
      const orderDetailContact = await findOrderDetailContactById(id)
      if (!orderDetailContact) {
        return res
          .status(404)
          .send({ success: false, message: 'Pod Contact not  found.' })
      }

      const detailRes = await updateOrderDetailContact(parseInt(id), data)
      if (detailRes[0] === 0) {
        return res
          .status(404)
          .send({ success: false, message: 'Pod Contact not  updated.' })
      }

      const orderDetailContactUpdated = await findOrderDetailContactById(id)

      return res.status(200).send({
        success: true,
        message: 'Success updating the Pod Contact.',
        data: orderDetailContactUpdated
      })
    }
  } catch (error) {
    handleHttpError(res, 'Error updating the Pod Contact ' + error)
  }
}

export async function deleteByID (req: Request, res: Response): Promise<any> {
  const id = req.params.id
  try {
    await deleteOrderDetailContactById(id)

    return res.status(200).send({
      success: true,
      message: 'Success deleting the Pod Contact'
    })
  } catch (error) {
    handleHttpError(res, 'Error deleting the Pod Contact ' + error)
  }
}
