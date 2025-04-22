/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-var-requires */
import { type Request, type Response } from 'express'
import { OrderScheme, ReOrderScheme, type Order } from '../interfaces/IOrder'
import { type PackagingOrder } from '../interfaces/packagingOrder'
import { findContactById } from '../services/contacts.service'
import {
  getOrderErrorById,
  listOrderErrors
} from '../services/orderError.service'
import {
  createOrder,
  createOrderTimeline,
  getByOrderNumberAndSourceIDService,
  getByOrderNumberAndSourceService,
  getBySourceService,
  getOrderById,
  getOrderByIdForReorder,
  getOrderStatus,
  getOrdersList,
  getOrdersListByStoreId,
  reorderFromService,
  updateOrderStatus
} from '../services/orders.service'
import { createPackagingOrder } from '../services/packagingOrder'
import { createOrderDetail } from '../services/pods.service'
import { getSourceById } from '../services/source'
import {
  handleHttpError,
  handleValidationError
} from '../utils/handleHTTPResponses'
import { validateSkuProdService } from '../utils/validateSkus'
import { findStatusByNameAndStatusTypeName } from '../services/status.service'
import { findStoreByParamId } from '../services/stores.service'

export async function create (req: Request, res: Response): Promise<any> {
  try {
    const result = OrderScheme.safeParse(req.body)
    if (!result.success) {
      return handleValidationError(res, result.error)
    } else {
      const data: Order = result.data

      const createdOrder = await createOrder(data)

      if (createdOrder.id) {
        return res
          .status(200)
          .send({
            success: true,
            message: 'New order created',
            data: createdOrder
          })
      }
      console.log(createdOrder)
      return res
        .status(500)
        .send({ success: false, message: 'Error saving data' })
    }
  } catch (error) {
    console.log(error)
    handleHttpError(res, 'Error creating order ' + error)
  }
}

export async function reorder (req: Request, res: Response): Promise<any> {
  try {
    const result = ReOrderScheme.safeParse(req.body)
    if (!result.success) {
      return handleValidationError(res, result.error)
    } else {
      const id = result.data.id
      /**
       * Getting the current order for reorder
       */
      const orderForCopy = await getOrderByIdForReorder(id.toString())
      /**
       * Assigning pods and preparing create order object
       */
      const pods: any[] = orderForCopy.orderDetails
      const { total_price, order_number } = orderForCopy.dataValues
      const total_price_fixed = parseFloat(total_price.substr(1))
      /**
       * Creating the main order based on an existing order
       */
      const orderRes = await reorderFromService({
        total_price_fixed,
        id,
        order_number
      })
      /**
       * If was created, then create the pods
       */
      if (orderRes.id) {
        const addresses: Array<{ address: string, id: number }> = []
        const data: Array<{ packaging: number, pod: any }> = []
        /**
         * Copying pod in the base order
         */
        for (const element of pods) {
          const pod = {
            quantity: element.quantity,
            info: element.info,
            product_id: element.product_id,
            order_id: orderRes.id,
            source_id: element.source_id,
            store_id: element.store_id || 1,
            contact_id: element.contact_id,
            status_id: 1,
            pack_id: element.pack_id
          }
          /**
           * Getting the Source
           */
          const theSource = await getSourceById(pod.source_id)
          /**
           * Getting the packaging instructions
           */
          const packaging_instructions_id = theSource.packagingInstruction.id
          /**
           * Getting the User
           */
          const theUser = await findContactById(element.contact_id)
          /**
           * Getting the address
           */
          const theAddress =
            theUser.address_1 + theUser.address_2.replace(' ', '')
          let theId = 0

          if (addresses.some((e) => e.address === theAddress)) {
            const getAddress = addresses.find((e) => e.address === theAddress)
            if (getAddress != null) theId = getAddress.id
          } else {
            const packaging: PackagingOrder = {
              status_id: 12,
              packaging_instructions_id
            }
            const packagingCreated = await createPackagingOrder(packaging)
            addresses.push({ address: theAddress, id: packagingCreated.id })
            theId = packagingCreated.id
          }
          data.push({ packaging: theId, pod })
        }
        /**
         * Creating the pods
         */
        for (const element of data) {
          const pod = { ...element.pod, packaging_order_id: element.packaging }
          await createOrderDetail(pod)
        }
        /**
         * Creating the timeline for the order
         */
        const statusForOrderTimeline = await findStatusByNameAndStatusTypeName(
          'pending',
          'orders'
        )
        if (statusForOrderTimeline?.id) {
          await createOrderTimeline({
            old_status: statusForOrderTimeline?.id,
            new_status: statusForOrderTimeline?.id,
            order_id: orderRes.id
          })
        }
      }
      if (orderRes.id) {
        return res
          .status(200)
          .send({
            success: true,
            message: 'new order created',
            data: orderRes
          })
      }
      return res
        .status(500)
        .send({ success: false, massage: 'Error saving data', data: orderRes })
    }
  } catch (error) {
    console.log(error)
    handleHttpError(res, 'Error in the reorder process: ' + error)
  }
}

export async function list (_: Request, res: Response): Promise<any> {
  try {
    const ordersRes = await getOrdersList()
    return res.status(200).send({
      success: true,
      message: 'Success getting the orders',
      data: ordersRes
    })
  } catch (error) {
    handleHttpError(res, 'Error connecting DB' + error)
  }
}
export async function listByStore (req: Request, res: Response): Promise<any> {
  try {
    /**
     * Getting the req.param.id and validate it
     */
    const paramId = req.params.id
    console.log('paramId.length', paramId.length)
    if (!paramId || paramId.length < 3) {
      return res.status(200).send({
        success: false,
        message: "Error, the param ID it's needed"
      })
    }
    console.log('paramId', paramId)
    /**
     * Validating the store param_id
     */
    const store = await findStoreByParamId(paramId)
    if (!store) {
      return res.status(404).send({
        success: false,
        message: 'Store not found'
      })
    }
    console.log('store', store)
    /**
     * Getting the orders by store ID
     */
    const ordersRes = await getOrdersListByStoreId(store.id)
    /**
     * Response
     */
    return res.status(200).send({
      success: true,
      message: 'Success getting the orders',
      data: ordersRes
    })
  } catch (error) {
    handleHttpError(res, 'Error connecting DB' + error)
  }
}

export async function listLogs (_: Request, res: Response): Promise<any> {
  try {
    console.log('ordersLogs')
    const ordersRes = await listOrderErrors()
    return res.status(200).send({
      success: true,
      message: 'Success getting the orders logs list',
      data: ordersRes
    })
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, massage: 'Error connecting DB', data: error })
  }
}

export async function getLogById (req: Request, res: Response): Promise<any> {
  const id = req.params.id
  try {
    const ordersRes = await getOrderErrorById(id)
    return res.status(200).send({
      success: true,
      message: 'Success getting the order log',
      data: ordersRes
    })
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, massage: 'Error connecting DB', data: error })
  }
}

export async function getByID (req: Request, res: Response): Promise<any> {
  const id = req.params.id
  try {
    const orderRes = await getOrderById(id)
    return res.status(200).send({
      success: true,
      message: 'Success getting the order',
      data: orderRes
    })
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, massage: 'Error connecting DB', data: error })
  }
}

export async function getByOrderNumberAndSource (
  orderIn: any,
  source_id: number
): Promise<any> {
  try {
    const orderRes = await getByOrderNumberAndSourceService(orderIn, source_id)
    return orderRes
  } catch (error) {
    return error
  }
}

export async function getByOrderNumberAndSourceId (
  orderNumber: string,
  source_id: number
): Promise<any> {
  try {
    const orderRes = await getByOrderNumberAndSourceIDService(
      orderNumber,
      source_id
    )
    return orderRes
  } catch (error) {
    return error
  }
}

export async function getBySource (req: Request, res: Response): Promise<any> {
  const source_id = req.params.id
  try {
    /**
     * Source Validation
     */
    const result = await getSourceById(parseInt(source_id))
    if (!result) {
      return res
        .status(404)
        .send({ success: false, message: 'Source not found.' })
    }
    /**
     * Getting orders by source ID
     */
    const ordersRes = await getBySourceService(source_id)
    if (ordersRes.length === 0) {
      return res.status(200).send({
        success: true,
        message: 'No orders with the selected Source'
      })
    }
    return res.status(200).send({
      success: true,
      message: 'Success getting the orders list',
      data: ordersRes
    })
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, massage: 'Error connecting DB', data: error })
  }
}

export async function updateStatus (req: Request, res: Response): Promise<any> {
  const { id, status_id } = req.body
  try {
    /**
     * Getting the old status
     */
    const oldStatus = await getOrderStatus(id)
    /**
     * Updating the order status
     */
    const orderRes = await updateOrderStatus(id, status_id)
    /**
     * Creating order timeline
     */
    await createOrderTimeline({
      old_status: oldStatus.status_id,
      new_status: status_id,
      order_id: id
    })

    return res
      .status(200)
      .send({ success: true, message: 'Order updated', data: orderRes })
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, massage: 'Error connecting DB', data: error })
  }
}

export async function validateSkuProd (
  sku: string,
  country: string
): Promise<any> {
  try {
    const validateSkuProdServiceRes = await validateSkuProdService(
      sku,
      country
    )
    return validateSkuProdServiceRes
  } catch (error) {
    return error
  }
}
