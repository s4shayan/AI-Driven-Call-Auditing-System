from fastapi import HTTPException
from App.db import engine
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError



def get_agent_comparison():
    try:
        with engine.connect() as conn:
            result=conn.execute(text("""SELECT a.agent_name, AVG(c.overall_score) * 20 AS average_score
            FROM Agent a
            LEFT JOIN Calls c ON a.agent_id = c.agent_id
            GROUP BY a.agent_id, a.agent_name
            ORDER BY average_score DESC """)).mappings()
            data=[dict(row) for row in result]
            return data
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500,detail=str(e)) 
    


def taskSummary():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT
                    SUM(CASE WHEN compliance_status = 'Passed' THEN 1 ELSE 0 END) AS Resolved,
                    SUM(CASE WHEN compliance_status IN ('Failed', 'NeedsReview') THEN 1 ELSE 0 END) AS In_Processing
                FROM Calls
            """)).mappings().first()

            return {
                "Resolved": result["Resolved"],
                "In_Processing": result["In_Processing"]
            }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
