/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-var-requires */
import { type Request, type Response } from 'express'
import { PodScheme, type Pod } from '../interfaces/IPod'
import { addDesignToAPod, createOrderDetail, getPODById, updatePodStatus } from '../services/pods.service'
import { handleValidationError } from '../utils/handleHTTPResponses'

export async function create (req: Request, res: Response): Promise<any> {
  try {
    const result = PodScheme.safeParse(req.body)
    if (!result.success) {
      return handleValidationError(res, result.error)
    } else {
      const data: Pod = result.data
      const createdPod = await createOrderDetail(data)
      if (createdPod.id) {
        return res.status(200).send({ code: 200, message: 'new pod created', data: createdPod })
      }
      return res.status(500).send({ code: 500, massage: 'Error saving data', data: createdPod })
    }
  } catch (error) {
    return error
  }
}

export async function addDesign (req: Request, res: Response): Promise<any> {
  try {
    const result = await addDesignToAPod(req.body)
    if (result.id) {
      return res.status(200).send({ success: true, message: 'Added design', data: result })
    }
    return res.status(500).send({ success: false, massage: 'Error saving data', data: result })
  } catch (error) {
    console.log(error)
    return error
  }
}

export async function updateStatus (req: Request, res: Response): Promise<any> {
  const { id, status_id } = req.body
  try {
    const validation = await getPODById(id)

    if (!validation?.id) {
      return res
        .status(404)
        .send({ success: false, message: "The seledted Pod doesn't exist" })
    }

    await updatePodStatus({ id, status_id })

    return res
      .status(200)
      .send({ success: true, message: 'Pod updated' })
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, massage: 'Error connecting DB', data: error })
  }
}
